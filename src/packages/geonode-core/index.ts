// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { DeclaredService } from "@open-pioneer/runtime";

export interface GeoNodeProperties {
    geonodeOptions: GeoNodeOptions;
}

export interface GeoNodeOptions {
    geonodeConfig: GeoNodeConfig;
}

export interface GeoNodeConfig {
    baseUrl: string | URL;
}

export interface GeoNodeConfigService extends DeclaredService<"geonode-core.ConfigService"> {
    getGeonodeConfig(): GeoNodeConfig;
    getGeoNodeBaseUrl(): URL;
}
