// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { BeforeRequestParams, Interceptor } from "@open-pioneer/http";
import { AuthService } from "@open-pioneer/authentication";
import { ServiceOptions } from "@open-pioneer/runtime";
import { GeoNodeConfigService, GeoNodeConfig } from ".";

/**
 * This interceptor adds an example token to certain requests.
 * Open the developer console (GET requests to the specified host)
 * and inspect the request headers to see the effect of this.
 */

interface References {
    authService: AuthService;
    configService: GeoNodeConfigService;
}

export class GeoNodeTokenInterceptor implements Interceptor {
    #authService: AuthService;
    #geonodeConfig: GeoNodeConfig;

    constructor(options: ServiceOptions<References>) {
        const references = options.references;
        this.#authService = references.authService;
        this.#geonodeConfig = references.configService.getGeonodeConfig();
    }

    beforeRequest({ target, options }: BeforeRequestParams): void {
        const authState = this.#authService.getAuthState();
        const sessionInfo = authState.kind == "authenticated" ? authState.sessionInfo : undefined;
        const token = sessionInfo?.attributes?.accessToken as string;
        const geonodeBaseUrl = this.#geonodeConfig.baseUrl as URL;
        const matchesProtocol = target.protocol === "https:" || import.meta.env.DEV;
        if (matchesProtocol && target.hostname === geonodeBaseUrl.hostname && token) {
            options.headers.set("Authorization", `Bearer ${token}`);
        }
    }
}
