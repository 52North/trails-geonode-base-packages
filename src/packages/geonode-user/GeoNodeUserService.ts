// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { DeclaredService, ServiceOptions } from "@open-pioneer/runtime";
import { AuthService } from "@open-pioneer/authentication";
import { HttpService, HttpServiceRequestInit } from "@open-pioneer/http";
import { GeoNodeConfigService } from "geonode-core";
import { GeoNodeUserService, TokenInfoResponse, UserInfoResponse } from "./api";

interface Reference {
    httpClient: HttpService;
    authService: AuthService;
    configService: GeoNodeConfigService;
}

export class GeoNodeUserServiceImpl implements GeoNodeUserService {
    #authService: AuthService;
    #httpClient: HttpService;
    #configService: GeoNodeConfigService;

    constructor(options: ServiceOptions<Reference>) {
        this.#httpClient = options.references.httpClient;
        this.#configService = options.references.configService;
        this.#authService = options.references.authService;
    }

    getTokenInfo(): Promise<TokenInfoResponse> {
        const token = this.#getToken();
        return this.#fetch("/api/o/v4/tokeninfo/", {
            method: "POST",
            body: new URLSearchParams({ token })
        }).then(async (response) => (await response.json()) as TokenInfoResponse);
    }

    getUserInfo(): Promise<UserInfoResponse> {
        const token = this.#getToken();
        return this.#fetch("/api/o/v4/userinfo/", { method: "POST" }).then(
            async (response) => (await response.json()) as UserInfoResponse
        );
    }

    getGroups(): Promise<Response> {
        return this.#fetch("/api/v2/groups");
    }

    #getToken() {
        const authState = this.#authService.getAuthState();
        const sessionInfo = authState.kind == "authenticated" ? authState.sessionInfo : undefined;
        return sessionInfo?.attributes?.accessToken as string;
    }

    #fetch(path: string, init?: HttpServiceRequestInit): Promise<Response> {
        const geonodeConfig = this.#configService.getGeonodeConfig();
        const url = new URL(path, geonodeConfig.baseUrl);
        return this.#httpClient.fetch(url, init);
    }
}
