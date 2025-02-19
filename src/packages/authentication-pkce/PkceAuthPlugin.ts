// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { reactive } from "@conterra/reactivity-core";
import {
    AuthPlugin,
    AuthState,
    AuthStateAuthenticated,
    LoginBehavior
} from "@open-pioneer/authentication";
import { Resource, createLogger, destroyResource } from "@open-pioneer/core";
import { NotificationService } from "@open-pioneer/notifier";
import { LocalStorageService } from "@open-pioneer/local-storage";
import { PackageIntl, ServiceOptions } from "@open-pioneer/runtime";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { OpenIdClaims, PkceOptions, PkceProperties, RefreshOptions } from "./api";
import { AccessContext, PkceAuthClient } from "./PkceAuthClient";

const LOG = createLogger("authentication-pkce:PkceAuthPlugin");

interface References {
    pkceOptions: PkceOptions;
    notifier: NotificationService;
    storage: LocalStorageService;
}

export class PkceAuthPluginImpl implements AuthPlugin {
    #notifier: NotificationService;
    #intl: PackageIntl;
    #pkceOptions: PkceOptions;
    #oauthClient: PkceAuthClient;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    #timerId: any;
    #watcher: Resource | undefined;

    #state = reactive<AuthState>({
        kind: "not-authenticated"
    });

    constructor(options: ServiceOptions<References>) {
        this.#notifier = options.references.notifier;
        this.#intl = options.intl;

        try {
            this.#pkceOptions = this.#getPkceConfig(options.properties);
        } catch (e) {
            throw new Error("Invalid pkce configuration!", { cause: e });
        }

        try {
            const notifier = this.#notifier;
            const pkceOptions = this.#pkceOptions;
            const storage = options.references.storage;
            this.#oauthClient = new PkceAuthClient(pkceOptions, notifier, storage);
        } catch (e) {
            throw new Error("Failed to construct pkce client!", { cause: e });
        }

        const oauthClient = this.#oauthClient;
        if (oauthClient.isReturningFromAuthServer()) {
            this.#receiveCode().then(() => {
                const url = new URL(location.href);
                const query = url.searchParams;
                // clean URL from oauth params
                query.delete("code");
                query.delete("state");
                history.pushState({}, "", url);
            });
        } else {
            this.#restoreState();
        }
    }

    destroy() {
        clearInterval(this.#timerId);
        this.#watcher = destroyResource(this.#watcher);
        this.#timerId = undefined;
    }

    getAuthState(): AuthState {
        return this.#state.value;
    }

    getLoginBehavior(): LoginBehavior {
        const doLogin = async () => {
            this.startCodeFlow();
        };

        return {
            kind: "effect",
            login: doLogin
        };
    }

    logout(): void {
        this.#oauthClient.logout();
        this.#updateState({
            kind: "not-authenticated"
        });
    }

    async startCodeFlow() {
        await this.#oauthClient.requestAuthorizationCode().catch((e) => {
            this.#updateState({
                kind: "error",
                error: e
            });
            this.#notifier.notify({
                level: "error",
                title: this.#intl.formatMessage({
                    id: "loginFailed.title"
                }),
                message: this.#intl.formatMessage({
                    id: "loginFailed.message"
                })
            });
            LOG.error("Failed to check if user is authenticated", e);
        });
    }

    async #receiveCode() {
        const client = this.#oauthClient;
        client.receiveCode();
        const tokens = await client.getTokens();
        this.#authenticate(tokens);
    }

    #restoreState() {
        const oauthClient = this.#oauthClient;
        if (oauthClient.isAuthorized()) {
            if (oauthClient.isExpiredAccessToken()) {
                oauthClient
                    .exchangeRefreshTokenForAccessToken()
                    .then((ctx) => this.#authenticate(ctx))
                    .catch((error) => {
                        this.#notifier.error({ message: "Token exchange failed!" });
                        console.error(error);
                    });
            } else {
                oauthClient
                    .getTokens()
                    .then((ctx) => this.#authenticate(ctx))
                    .catch((error) => {
                        this.#notifier.error({ message: "Token exchange failed!" });
                        console.error(error);
                    });
            }
        }
    }

    #authenticate(ctx: AccessContext) {
        const pkceOptions = this.#pkceOptions;
        const refreshOptions = pkceOptions.refreshOptions;
        const idTokenParsed = jwtDecode<OpenIdClaims>(ctx.idToken!);
        const issuedAt: number = idTokenParsed.iat ?? 0;
        const expiresIn: number = idTokenParsed.exp ?? 0;
        const authState: AuthStateAuthenticated = {
            kind: "authenticated",
            sessionInfo: {
                userId: idTokenParsed.sub ?? "undefined",
                userName: idTokenParsed.preferred_username ?? "",
                attributes: {
                    issuer: idTokenParsed.iss ?? "unknown",
                    familyName: idTokenParsed.family_name ?? "",
                    givenName: idTokenParsed.given_name ?? "",
                    accessToken: ctx.accessToken,
                    // NumericDate are in seconds
                    // see https://www.rfc-editor.org/rfc/rfc7519#section-2
                    expiresAt: new Date(expiresIn * 1000),
                    issuedAt: new Date(issuedAt * 1000)
                }
            }
        };
        this.#updateState(authState);
        LOG.debug(`User ${authState.sessionInfo.userId} is authenticated`);

        if (refreshOptions.autoRefresh) {
            LOG.debug("Starting auto-refresh", refreshOptions);
            this.__refresh(refreshOptions.interval);
        }
    }

    #updateState(newState: AuthState) {
        this.#state.value = newState;
    }

    #getPkceConfig(properties: Partial<PkceProperties>): PkceOptions {
        const { pkceOptions } = properties;
        const { pkceConfig, clientConfig, refreshOptions } = pkceOptions!;
        return {
            pkceConfig: { ...pkceConfig },
            clientConfig: { ...clientConfig },
            refreshOptions: parseRefreshOptions(refreshOptions)
        };
    }

    private __refresh(interval: number) {
        clearInterval(this.#timerId);
        this.#timerId = setInterval(() => {
            const oauthClient = this.#oauthClient;
            if (oauthClient.isExpiredAccessToken()) {
                oauthClient
                    .exchangeRefreshTokenForAccessToken()
                    .then((ctx) => this.#authenticate(ctx))
                    .catch((e) => {
                        LOG.error("Failed to refresh token", e);
                        this.#updateState({
                            kind: "not-authenticated"
                        });
                        this.destroy();
                    });
            }
        }, interval);
    }
}

function parseRefreshOptions(options: Partial<RefreshOptions>): RefreshOptions {
    const autoRefresh = (options.autoRefresh ?? "false") as string;
    const storeRefreshToken = (options.storeRefreshToken ?? "false") as string;
    return {
        storeRefreshToken: /true/.test(storeRefreshToken),
        autoRefresh: /true/.test(autoRefresh),
        interval: options.interval ?? 360000
    };
}
