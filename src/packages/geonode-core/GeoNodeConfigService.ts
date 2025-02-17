// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { ServiceOptions } from "@open-pioneer/runtime";
import { GeoNodeConfig, GeoNodeConfigService, GeoNodeOptions, GeoNodeProperties } from ".";

export class GeoNodeConfigServiceImpl implements GeoNodeConfigService {
    #geonodeOptions: GeoNodeOptions;

    constructor(options: ServiceOptions) {
        this.#geonodeOptions = getProperties(options.properties);
    }

    getGeonodeConfig(): GeoNodeConfig {
        return this.#geonodeOptions.geonodeConfig;
    }

    getGeoNodeBaseUrl(): URL {
        const geonodeConfig = this.#geonodeOptions.geonodeConfig;
        return geonodeConfig.baseUrl as URL;
    }
}

function getProperties(properties: Partial<GeoNodeProperties>): GeoNodeOptions {
    const { geonodeOptions } = properties;

    const { geonodeConfig } = geonodeOptions!;

    return {
        geonodeConfig: {
            baseUrl: new URL(geonodeConfig.baseUrl)
        }
    };
}
