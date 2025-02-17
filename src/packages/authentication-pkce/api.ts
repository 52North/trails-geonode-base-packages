// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Configuration } from "oauth2-pkce";

export interface PkceProperties {
    pkceOptions: PkceOptions;
}

export interface PkceOptions {
    scopes?: string | string[];
    pkceConfig: Configuration;
    refreshOptions: RefreshOptions;
}

export interface RefreshOptions {
    /**
     * Whether token refreshing should happen automatically.
     */
    autoRefresh: boolean;
    /**
     * The interval (in milliseconds) at which token refreshing should occur.
     */
    interval: number;
}
