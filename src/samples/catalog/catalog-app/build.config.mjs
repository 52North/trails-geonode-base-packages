// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    i18n: ["en"],
    styles: "./styles.scss",
    ui: {
        references: [
            "notifier.NotificationService",
            "geonode-search.SearchService",
            "geonode-catalog.CatalogService"
        ]
    },
    services: {
        ResultPreviewMapProvider: {
            provides: ["map.MapConfigProvider"]
        },
        FacetExtentMapProvider: {
            provides: ["map.MapConfigProvider"]
        },
        FacetExtentModalMapProvider: {
            provides: ["map.MapConfigProvider"]
        }
    }
});
