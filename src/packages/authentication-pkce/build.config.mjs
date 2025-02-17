// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    i18n: ["en"],
    services: {
        PkceAuthPluginImpl: {
            provides: ["authentication.AuthPlugin"],
            references: {
                notifier: "notifier.NotificationService"
            }
        }
    },
    properties: {
        pkceOptions: {
            pkceConfig: null,
            refreshOptions: null
        }
    }
});
