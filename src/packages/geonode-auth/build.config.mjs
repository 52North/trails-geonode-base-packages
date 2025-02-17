// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    services: {
        GeoNodeTokenInterceptor: {
            provides: ["http.Interceptor"],
            references: {
                authService: "authentication.AuthService",
                configService: "geonode.ConfigService"
            }
        }
    },
    properties: {
        geonodeOptions: {
            geonodeConfig: null
        }
    }
});
