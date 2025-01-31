// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box } from "@open-pioneer/chakra-integration";
import { useEffect } from "react";
import { SearchResultEntry } from "catalog";
import { MapContainer, MapModel, useMapModel } from "@open-pioneer/map";
import { RESULT_PREVIEW_MAP_ID } from "../services/result-preview-map-provider";
import { transformExtent } from "ol/proj";
import TileLayer from "ol/layer/Tile";
import { TileWMS } from "ol/source";

export interface GeoResultMapProps {
    result: SearchResultEntry;
}

export function GeoResultMap(props: GeoResultMapProps) {
    const { result } = props;

    const { map } = useMapModel(RESULT_PREVIEW_MAP_ID);

    useEffect(() => {
        if (map) {
            setExtent(map);
            setLayer(map);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, result]);

    return (
        <Box height="100%" width="100%">
            <MapContainer mapId={RESULT_PREVIEW_MAP_ID}></MapContainer>
        </Box>
    );

    function setExtent(map: MapModel) {
        const resultExtent = result.extent;
        if (resultExtent) {
            const target = map.olView.getProjection();
            const origin = resultExtent.srid;
            const transformedExtent = transformExtent(resultExtent.coords, origin, target);
            map.olView.fit(transformedExtent, { padding: [30, 30, 30, 30] });
        }
    }

    function setLayer(map: MapModel) {
        // TODO: check with WFS
        const matchWMS = result.links?.find((l) => l.link_type === "OGC:WMS");
        if (matchWMS && result.alternate) {
            const layer = new TileLayer({
                source: new TileWMS({
                    url: matchWMS.url,
                    params: { "LAYERS": result.alternate, "TILED": true },
                    serverType: "geoserver",
                    transition: 0
                })
            });
            map.olMap.addLayer(layer);
        }
    }
}
