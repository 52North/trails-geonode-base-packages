// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    i18n: ["en"],
    services: {
        GeoNodeUserServiceImpl: {
            provides: ["geonode-user.UserService"],
            references: {
                authService: "authentication.AuthService",
                configService: "geonode-core.ConfigService",
                httpClient: "http.HttpService"
            }
        }
    }
});
