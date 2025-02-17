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
import { PackageIntl, Service, ServiceOptions } from "@open-pioneer/runtime";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { AccessContext, Configuration, OAuth2AuthCodePkceClient } from "oauth2-pkce";
import { PkceOptions, PkceProperties, RefreshOptions } from "./api";

const LOG = createLogger("authentication-pkce:PkceAuthPlugin");

interface References {
    notifier: NotificationService;
}

export class PkceAuthPluginImpl implements Service, AuthPlugin {
    #notifier: NotificationService;
    #intl: PackageIntl;
    #pkceOptions: PkceOptions;
    #oauthClient: OAuth2AuthCodePkceClient;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    #timerId: any;
    #watcher: Resource | undefined;

    #state = reactive<AuthState>({
        kind: "pending"
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
            const config = this.#pkceOptions.pkceConfig;
            this.#oauthClient = new OAuth2AuthCodePkceClient(config);
        } catch (e) {
            throw new Error("Failed to construct pkce client!", { cause: e });
        }

        const oauthClient = this.#oauthClient;
        /* eslint-disable  @typescript-eslint/no-explicit-any */
        const patchedClient = oauthClient as any;
        patchedClient.ready.then(() => {
            if (oauthClient.isReturningFromAuthServer()) {
                this.#receiveCode().then(() => {
                    delete patchedClient.state.authorizationCode;
                    delete patchedClient.state.codeChallenge;
                    delete patchedClient.state.codeVerifier;
                    delete patchedClient.state.code;
                    patchedClient.saveState().then(() => {
                        const location = window.location;
                        const query = new URLSearchParams(location.search);
                        query.delete("code");
                        query.delete("state");
                        location.search = query.size ? query.toString() : "";
                    });
                });
            } else {
                this.#restoreState();
            }
        });
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
        this.#oauthClient.reset();
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
        return this.#oauthClient
            .receiveCode()
            .then(async () => {
                const client = this.#oauthClient;
                const tokens = await client.getTokens();
                this.#authenticate(tokens);
            })
            .catch((e) => {
                const error = typeof e === "string" ? new Error(e) : e;
                throw new Error("Failed to initialize PKCE session", { cause: error });
            });
    }

    #restoreState() {
        const oauthClient = this.#oauthClient;
        if (oauthClient.isAuthorized()) {
            if (oauthClient.isAccessTokenExpired()) {
                oauthClient
                    .exchangeRefreshTokenForAccessToken()
                    .then((ctx) => this.#authenticate(ctx));
            } else {
                oauthClient.getTokens().then((ctx) => this.#authenticate(ctx));
            }
        }
    }

    #authenticate(ctx: AccessContext) {
        const pkceOptions = this.#pkceOptions;
        const refreshOptions = pkceOptions.refreshOptions;
        const idTokenParsed = jwtDecode<JwtPayload>(ctx.idToken!);
        const authState: AuthStateAuthenticated = {
            kind: "authenticated",
            sessionInfo: {
                userId: idTokenParsed.sub ?? "undefined",
                //userName: this.#keycloak.idTokenParsed?.preferred_username,
                attributes: {
                    accessToken: ctx.accessToken,
                    issuer: idTokenParsed.iss ?? "undefined"
                    //     familyName: this.#keycloak.idTokenParsed?.family_name,
                    //     givenName: this.#keycloak.idTokenParsed?.given_name,
                    //     userName: this.#keycloak.idTokenParsed?.preferred_username
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
        const { scopes, pkceConfig, refreshOptions } = pkceOptions!;
        return {
            pkceConfig: {
                ...parsePkceConfig(
                    Object.assign(pkceConfig, {
                        onAccessTokenExpiry: this.#onAccessTokenExpiry,
                        onInvalidGrant: this.#onInvalidLogin,
                        onInvalidToken: this.#onInvalidLogin
                    })
                ),
                scopes: Array.isArray(scopes) ? scopes : (scopes?.split(",") ?? ["openid"])
            },
            refreshOptions: parseRefreshOptions(refreshOptions)
        };
    }

    #onAccessTokenExpiry(): Promise<AccessContext> {
        this.#notifier.notify({
            level: "error",
            message: "Token has expired! Please re-login and try again."
        });
        return Promise.resolve({});
    }

    #onInvalidLogin(): void {
        this.#notifier.notify({
            level: "error",
            message: "Login not succeeded!"
        });
    }

    private __refresh(interval: number) {
        clearInterval(this.#timerId);
        this.#timerId = setInterval(() => {
            const oauthClient = this.#oauthClient;
            if (oauthClient.isAccessTokenExpired()) {
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

function parsePkceConfig(pkceConfig: Configuration) {
    return {
        ...pkceConfig,
        storeRefreshToken: true
    };
}

function parseRefreshOptions(options: Partial<RefreshOptions>): RefreshOptions {
    const autoRefresh = (options.autoRefresh ?? "false") as string;
    return {
        autoRefresh: /true/.test(autoRefresh),
        interval: options.interval ?? 360000
    };
}
