// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import pkceChallenge from "pkce-challenge";
import { HttpService } from "@open-pioneer/http";
import { ClientConfig, PkceConfiguration, PkceOptions } from "./api";
import { NotificationService } from "@open-pioneer/notifier";
import { LocalStorageNamespace, LocalStorageService } from "@open-pioneer/local-storage";

export const RECOMMENDED_STATE_LENGTH = 32;
export const STORAGE_PKCE_STATE = "authentication-pkce";

export interface State {
    accessToken?: string;
    accessTokenExpiry?: string;
    authorizationCode?: string;
    codeChallenge?: string;
    codeVerifier?: string;
    idToken?: string;
    refreshToken?: string;
    stateParam?: string;
    scopes?: string[];
}

export interface AccessContext {
    accessToken?: string;
    idToken?: string;
    scopes?: string[];
}

export interface TokenResponse {
    accessToken?: string;
    expiresIn?: string;
    scope?: string;
    refreshToken?: string;
    idToken?: string;
}

export class PkceAuthClient {
    #pkceConfig: PkceConfiguration;
    #clientConfig: ClientConfig;
    #notifier: NotificationService;
    #storage: LocalStorageNamespace;
    #storeRefreshToken: boolean;
    #state: State;

    constructor(
        pkceOptions: PkceOptions,
        notifier: NotificationService,
        storage: LocalStorageService
    ) {
        this.#pkceConfig = pkceOptions.pkceConfig;
        this.#clientConfig = pkceOptions.clientConfig;
        this.#storeRefreshToken = pkceOptions.refreshOptions.storeRefreshToken;
        this.#storage = storage;
        this.#notifier = notifier;

        this.#state = {};
        this.recoverState();
    }

    async logout() {
        const { revokeTokenUrl } = this.#pkceConfig;
        const { clientId } = this.#clientConfig;
        const { accessToken } = this.#state;
        if (!accessToken) {
            return;
        }

        const query = new URLSearchParams({
            token: accessToken,
            client_id: clientId
        });
        await fetch(revokeTokenUrl, {
            method: "POST",
            body: query.toString(),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).catch((error) => {
            this.#notifier.error({
                message: error
            });
        });
        this.resetState();
    }

    resetState() {
        this.#state = {};
        this.#saveState();
    }

    isAuthorized(): boolean {
        const state = this.#state;
        const { accessToken = "" } = state;
        return !!accessToken && !this.isExpiredAccessToken();
    }

    isExpiredAccessToken() {
        const { accessTokenExpiry } = this.#state;
        if (!accessTokenExpiry) {
            return false;
        }
        const expiresAt = new Date(accessTokenExpiry);
        return Date.now() >= expiresAt.getTime();
    }

    async requestAuthorizationCode() {
        const { authorizationUrl } = this.#pkceConfig;
        const { clientId, redirectUrl, scopes } = this.#clientConfig;

        const { code_challenge, code_verifier } = await pkceChallenge();
        const stateParam = generateRandomState(RECOMMENDED_STATE_LENGTH);

        // save state before redirect
        this.#state = {
            ...this.#state,
            stateParam,
            codeChallenge: code_challenge,
            codeVerifier: code_verifier
        };
        this.#saveState();
        const query = new URLSearchParams({
            response_type: "code",
            client_id: clientId,
            code_challenge: code_challenge,
            code_challenge_method: "S256",
            redirect_uri: redirectUrl.toString(),
            state: stateParam
        });
        if (scopes) {
            query.set("scope", Array.isArray(scopes) ? scopes.join(" ") : scopes);
        }

        const url = new URL(authorizationUrl);
        url.search = query.toString();

        // go to auth server
        location.replace(url);
    }

    public isReturningFromAuthServer(): boolean {
        return !!extractParamFromLocation("code");
    }

    receiveCode() {
        const error = extractParamFromLocation("error");
        if (error) {
            this.#notifier.error({ message: "Unable to login!" });
            const description = extractParamFromLocation("error_description");
            const descriptionInfo = description ? `: ${description}` : "";
            const url = extractParamFromLocation("error_uri");
            const urlInfo = url ? ` (${url})` : "";
            throw new Error(`${error}${descriptionInfo}${urlInfo}`);
        }

        const stateParam = extractParamFromLocation("state");
        if (stateParam !== this.#state.stateParam) {
            this.#notifier.error({ message: "Unable to login!" });
            throw new Error("'state' parameter does not match! Possible malicious activity.");
        }

        const authorizationCode = extractParamFromLocation("code");
        if (!authorizationCode) {
            this.#notifier.error({ message: "Unable to login!" });
            throw new Error("No 'authorization_code' received!");
        }

        const state = this.#state;
        state.authorizationCode = authorizationCode;
        // delete challenge
        delete state.codeChallenge;

        this.#saveState();
    }

    async getTokens(): Promise<AccessContext> {
        const { accessToken, authorizationCode, idToken, refreshToken, scopes } = this.#state;

        if (authorizationCode) {
            return this.exchangeAuthCodeForAccessToken();
        }

        if (!accessToken) {
            this.#notifier.error({ message: "No access token available!" });
            throw new Error("No 'access_token' available!");
        }

        if (this.isExpiredAccessToken()) {
            this.resetState();
            Promise.resolve({});
        }

        return Promise.resolve({ accessToken, idToken, refreshToken, scopes });
    }

    async exchangeAuthCodeForAccessToken(): Promise<AccessContext> {
        return this.#setTokens(await this.#fetchAccessTokenUsingCode());
    }

    async exchangeRefreshTokenForAccessToken(): Promise<AccessContext> {
        return this.#setTokens(await this.#fetchAccessTokenUsingRefreshToken());
    }

    #fetchAccessTokenUsingCode(): Promise<TokenResponse> {
        const { authorizationCode = "", codeVerifier = "" } = this.#state;
        const { clientId, redirectUrl } = this.#clientConfig;
        const { tokenUrl } = this.#pkceConfig;

        if (!codeVerifier) {
            console.warn("No code_verifier present on token request!");
        } else if (!authorizationCode) {
            console.warn("No authorization_code present on token request.");
        }

        const query = new URLSearchParams({
            grant_type: "authorization_code",
            code_verifier: codeVerifier,
            code: authorizationCode,
            redirect_uri: redirectUrl,
            client_id: clientId
        });
        return this.#makeTokenRequest(tokenUrl, query.toString());
    }

    async #makeTokenRequest(tokenUrl: string, payload: string): Promise<TokenResponse> {
        const tokenResponse = await fetch(tokenUrl, {
            method: "POST",
            body: payload,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        const tokenPayload = await tokenResponse.json();
        if (tokenResponse.ok) {
            delete this.#state.stateParam;
            delete this.#state.codeVerifier;
            delete this.#state.authorizationCode;
            const { access_token, expires_in, id_token, refresh_token, scope } = tokenPayload;
            return {
                accessToken: access_token,
                expiresIn: expires_in,
                idToken: id_token,
                refreshToken: refresh_token,
                scope
            };
        } else {
            throw new Error("Failed to get token!");
        }
    }

    async #fetchAccessTokenUsingRefreshToken() {
        const { tokenUrl } = this.#pkceConfig;
        const { clientId } = this.#clientConfig;
        const { refreshToken } = this.#state;

        if (!refreshToken) {
            console.warn("No refresh token is present.");
            throw new Error("No refresh_token!");
        }

        const query = new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: clientId
        });
        return this.#makeTokenRequest(tokenUrl, query.toString());
    }

    #setTokens(tokenResponse: TokenResponse): AccessContext {
        const { accessToken, expiresIn = "0", idToken, refreshToken, scope } = tokenResponse;
        const expiresAt = Date.now() + parseInt(expiresIn, 10) * 1000;

        const state = this.#state;
        state.accessToken = accessToken;
        state.accessTokenExpiry = expiresAt.toString();
        state.idToken = idToken ?? undefined;
        state.refreshToken = refreshToken ?? undefined;
        // parse space separated scopes
        state.scopes = scope ? scope.split(" ") : [];
        this.#saveState();

        return {
            idToken: state.idToken,
            accessToken: state.accessToken,
            scopes: state.scopes
        };
    }

    #saveState() {
        const state = { ...this.#state };
        if (!this.#storeRefreshToken) {
            delete state.refreshToken;
        }
        this.#storage.set(STORAGE_PKCE_STATE, state);
    }

    recoverState() {
        this.#state = (this.#storage.get(STORAGE_PKCE_STATE) as State) ?? {};
    }
}

function extractParamFromLocation(parameter: string) {
    const query = location.search;
    const params = new URLSearchParams(query);
    return params.get(parameter) ?? "";
}

function getRandomValues(size: number) {
    return crypto.getRandomValues(new Uint8Array(size));
}

const STATE_CHARSET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~";
const STATE_CHARSET_LENGTH = STATE_CHARSET.length;
const generateRandomState = (lengthOfState: number): string => {
    const randomValues = getRandomValues(lengthOfState);
    return randomValues.reduce((acc, curr) => {
        const index = curr % STATE_CHARSET_LENGTH;
        const randomChar = STATE_CHARSET[index];
        return acc + randomChar;
    }, "");
};
