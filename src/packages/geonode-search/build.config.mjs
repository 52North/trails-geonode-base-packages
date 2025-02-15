// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    services: {
        SearchServiceImpl: {
            provides: "geonode-search.SearchService",
            references: {
                configService: "geonode-core.ConfigService",
                catalogService: "geonode-catalog.CatalogService",
                notificationService: "notifier.NotificationService"
            }
        }
    },
    ui: {
        references: ["geonode-search.SearchService", "notifier.NotificationService"]
    }
});
