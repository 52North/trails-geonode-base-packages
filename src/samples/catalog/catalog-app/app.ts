// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createCustomElement } from "@open-pioneer/runtime";
import * as appMetadata from "open-pioneer:app";
import { AppUI } from "./AppUI";

const Element = createCustomElement({
    component: AppUI,
    appMetadata,
    config: {
        properties: {
            "geonode-core": {
                geonodeOptions: {
                    geonodeConfig: {
                        baseUrl: "https://webais.demo.52north.org"
                        //baseUrl: import.meta.env.VITE_GEONODE_BASE_URL
                    }
                }
            }
        }
    }
});

customElements.define("catalog-app", Element);
