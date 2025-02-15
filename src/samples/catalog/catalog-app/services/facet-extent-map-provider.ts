// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { MapConfig, MapConfigProvider, SimpleLayer } from "@open-pioneer/map";
import TileLayer from "ol/layer/Tile";
import { OSM } from "ol/source";

export const MAP_PROJECTION = "EPSG:3857";

export const FACET_EXTENT_MAP_ID = "facet_extent";
export class FacetExtentMapProvider implements MapConfigProvider {
    mapId = FACET_EXTENT_MAP_ID;

    async getMapConfig(): Promise<MapConfig> {
        return {
            initialView: {
                kind: "position",
                center: { x: 0, y: 0 },
                zoom: 1
            },
            projection: MAP_PROJECTION,
            layers: [
                new SimpleLayer({
                    title: "OpenStreetMap",
                    olLayer: new TileLayer({
                        source: new OSM(),
                        properties: { title: "OSM" }
                    }),
                    isBaseLayer: true
                })
            ]
        };
    }
}

export const FACET_EXTENT_MODAL_MAP_ID = "facet_extent_modal";
export class FacetExtentModalMapProvider implements MapConfigProvider {
    mapId = FACET_EXTENT_MODAL_MAP_ID;

    async getMapConfig(): Promise<MapConfig> {
        return {
            initialView: {
                kind: "position",
                center: { x: 0, y: 0 },
                zoom: 1
            },
            projection: MAP_PROJECTION,
            layers: [
                new SimpleLayer({
                    title: "OpenStreetMap",
                    olLayer: new TileLayer({
                        source: new OSM(),
                        properties: { title: "OSM" }
                    }),
                    isBaseLayer: true
                })
            ]
        };
    }
}
