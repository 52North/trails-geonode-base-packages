// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import {
    Box,
    Button,
    IconButton,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    useDisclosure,
    VStack
} from "@open-pioneer/chakra-integration";
import { MdClear, MdEdit } from "react-icons/md";
import { MapAnchor, MapContainer, MapModel, useMapModel } from "@open-pioneer/map";
import Draw, { createBox } from "ol/interaction/Draw";
import OlMap from "ol/Map";
import { ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { useService } from "open-pioneer:react-hooks";
import { useEffect, useState } from "react";
import Feature from "ol/Feature";
import { transformExtent } from "ol/proj";
import { fromExtent } from "ol/geom/Polygon";
import {
    FACET_EXTENT_MAP_ID,
    FACET_EXTENT_MODAL_MAP_ID,
    MAP_PROJECTION
} from "./services/facet-extent-map-provider";
import { GeometryExtentFacet, SearchService } from "geonode-search/api";

export function GeometryExtentFacetComp(props: {
    facet: GeometryExtentFacet;
    isExpanded: boolean;
}) {
    const { facet, isExpanded } = props;
    const { isOpen, onOpen, onClose } = useDisclosure();
    const searchSrvc = useService<SearchService>("geonode-search.SearchService");
    const facetMapModel = useMapModel(FACET_EXTENT_MAP_ID);
    const modalMapModal = useMapModel(FACET_EXTENT_MODAL_MAP_ID);
    const controller = useExtentController(facetMapModel.map, modalMapModal.map, facet, searchSrvc);

    useEffect(() => {
        if (isExpanded) {
            controller?.fitFeature();
        }
    }, [isExpanded, controller]);

    return (
        <>
            <Box height="200px">
                <MapContainer mapId={FACET_EXTENT_MAP_ID}>
                    <MapAnchor position="top-left">
                        <VStack p={2} gap={2}>
                            <ZoomIn mapId={FACET_EXTENT_MAP_ID} />
                            <ZoomOut mapId={FACET_EXTENT_MAP_ID} />
                        </VStack>
                    </MapAnchor>
                    <MapAnchor position="top-right">
                        <VStack p={2} gap={2}>
                            <IconButton
                                aria-label=""
                                size="sm"
                                icon={<MdEdit />}
                                onClick={() => {
                                    onOpen();
                                    controller?.activateExtentDraw();
                                }}
                            />
                            {controller?.hasExtent() && (
                                <IconButton
                                    aria-label=""
                                    size="sm"
                                    icon={<MdClear />}
                                    onClick={() => controller?.clearExtent()}
                                />
                            )}
                        </VStack>
                    </MapAnchor>
                </MapContainer>
            </Box>

            <Modal isOpen={isOpen} onClose={onClose} size="4xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Modal Title</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box height="500px">
                            <MapContainer mapId={FACET_EXTENT_MODAL_MAP_ID}>
                                <MapAnchor position="top-left">
                                    <VStack p={2} gap={2}>
                                        <ZoomIn mapId={FACET_EXTENT_MODAL_MAP_ID} />
                                        <ZoomOut mapId={FACET_EXTENT_MODAL_MAP_ID} />
                                    </VStack>
                                </MapAnchor>
                                <MapAnchor position="top-right">
                                    <VStack p={2} gap={2}>
                                        <IconButton
                                            aria-label=""
                                            size="sm"
                                            icon={<MdEdit />}
                                            onClick={() => controller?.activateExtentDraw()}
                                        />
                                    </VStack>
                                </MapAnchor>
                            </MapContainer>
                        </Box>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            mr={3}
                            onClick={() => {
                                controller?.clearExtent();
                                onClose();
                            }}
                        >
                            Clear extent
                        </Button>
                        <Button
                            mr={3}
                            onClick={() => {
                                controller?.applyExtent();
                                onClose();
                            }}
                        >
                            Apply extent
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}

function useExtentController(
    facetMapModel: MapModel | undefined,
    modalMapModel: MapModel | undefined,
    facet: GeometryExtentFacet,
    searchSrvc: SearchService
) {
    const [controller, setController] = useState<ExtentController | undefined>(undefined);

    useEffect(() => {
        if (!modalMapModel || !facetMapModel) {
            return;
        }
        const controller = new ExtentController(
            facetMapModel.olMap,
            modalMapModel.olMap,
            facet,
            searchSrvc
        );
        setController(controller);

        return () => {
            controller.destroy();
            setController(undefined);
        };
    }, [facetMapModel, modalMapModel, facet, searchSrvc]);

    return controller;
}

class ExtentController {
    private modalSource = new VectorSource({ wrapX: false });
    private modalVectorLayer = new VectorLayer({ source: this.modalSource });

    private facetSource = new VectorSource({ wrapX: false });
    private facetVectorLayer = new VectorLayer({ source: this.facetSource });

    private extentFeature: Feature | undefined;

    constructor(
        private facetMap: OlMap,
        private modalMap: OlMap,
        private facet: GeometryExtentFacet,
        private searchSrvc: SearchService
    ) {
        const extent = this.facet.getExtent();
        if (extent) {
            const geometry = fromExtent([
                extent.left,
                extent.bottom,
                extent.right,
                extent.top
            ]).transform("EPSG:4326", MAP_PROJECTION);
            this.extentFeature = new Feature({ geometry });
            this.setExtentOnFacetMap();
            this.modalSource.addFeature(this.extentFeature);
        }
        this.initLayer();
    }

    private setExtentOnFacetMap() {
        if (this.extentFeature) {
            this.facetSource.clear();
            this.facetSource.addFeature(this.extentFeature);
        }
    }

    hasExtent() {
        return this.extentFeature !== undefined;
    }

    fitFeature() {
        if (this.extentFeature) {
            const extent = this.extentFeature.getGeometry()?.getExtent();
            if (extent) {
                setTimeout(() => {
                    this.facetMap
                        .getView()
                        .fit(extent, { padding: [30, 30, 30, 30], duration: 300 });
                }, 10);
            }
        }
    }

    activateExtentDraw() {
        const draw = new Draw({
            type: "Circle",
            geometryFunction: createBox()
        });
        this.modalMap.addInteraction(draw);
        draw.on("drawend", (evt) => {
            this.extentFeature = evt.feature;
            this.modalSource.clear();
            this.modalSource.addFeature(this.extentFeature);
            this.modalMap.removeInteraction(draw);
        });
    }

    clearExtent() {
        this.extentFeature = undefined;
        this.modalSource.clear();
        this.facetSource.clear();
        this.facet.clearFilter();
        this.searchSrvc.startSearch();
    }

    applyExtent() {
        const extent = this.extentFeature?.getGeometry()?.getExtent();
        if (extent) {
            this.setExtentOnFacetMap();
            this.fitFeature();
            const transformedExtent = transformExtent(extent, MAP_PROJECTION, "EPSG:4326");
            const [left, bottom, right, top] = transformedExtent;
            if (
                left !== undefined &&
                bottom !== undefined &&
                top !== undefined &&
                right !== undefined
            ) {
                this.facet.setExtent({ left, bottom, right, top });
                this.searchSrvc.startSearch();
            }
        }
    }

    private initLayer() {
        this.modalMap.addLayer(this.modalVectorLayer);
        this.facetMap.addLayer(this.facetVectorLayer);
    }

    destroy() {
        this.modalSource.clear();
        this.facetSource.clear();
        this.modalMap.removeLayer(this.modalVectorLayer);
        this.facetMap.removeLayer(this.facetVectorLayer);
    }
}
