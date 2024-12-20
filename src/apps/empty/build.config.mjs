// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    i18n: ["en"],
    styles: "./styles.scss",
    ui: {
        references: [
            "SearchService",
            "notifier.NotificationService",
            "geonode-catalog.CatalogService"
        ]
    },
    services: {
        SearchServiceImpl: {
            provides: "SearchService",
            references: {
                catalogService: "geonode-catalog.CatalogService",
                notificationService: "notifier.NotificationService"
            }
        },
        ResultPreviewMapProvider: {
            provides: ["map.MapConfigProvider"]
        }
    }
});
