// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createCustomElement } from "@open-pioneer/runtime";
import * as appMetadata from "open-pioneer:app";
import { PkceOptions } from "authentication-pkce";
import { GeoNodeProperties } from "geonode-core";
import { AppUI } from "./AppUI";

const Element = createCustomElement({
    component: AppUI,
    appMetadata,
    config: {
        properties: {
            "geonode-core": {
                geonodeOptions: {
                    geonodeConfig: {
                        baseUrl: import.meta.env.VITE_GEONODE_BASE_URL
                    }
                }
            } satisfies GeoNodeProperties,
            "authentication-pkce": {
                pkceOptions: {
                    pkceConfig: {
                        authorizationUrl: import.meta.env.VITE_PKCE_CONFIG_AUTHORIZATION_URL,
                        revokeTokenUrl: import.meta.env.VITE_PKCE_CONFIG_REVOKE_URL,
                        tokenUrl: import.meta.env.VITE_PKCE_CONFIG_TOKEN_URL
                    },
                    clientConfig: {
                        clientId: import.meta.env.VITE_PKCE_CONFIG_CLIENT_ID,
                        redirectUrl: import.meta.env.VITE_PKCE_CONFIG_REDIRECT_URL,
                        scopes: import.meta.env.VITE_PKCE_CONFIG_SCOPES
                    },
                    refreshOptions: {
                        storeRefreshToken: import.meta.env.VITE_PKCE_CONFIG_STORE_REFRESH_TOKEN,
                        autoRefresh: import.meta.env.VITE_PKCE_REFRESH_OPTIONS_AUTO_REFRESH,
                        interval: import.meta.env.VITE_PKCE_REFRESH_OPTIONS_INTERVAL
                    }
                } satisfies PkceOptions
            }
        }
    }
});

customElements.define("token-info-app", Element);
