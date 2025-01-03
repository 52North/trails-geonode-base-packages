// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { useService } from "open-pioneer:react-hooks";
import { Center, CircularProgress, Container, VStack } from "@open-pioneer/chakra-integration";
import { useParams } from "react-router";
import { useState } from "react";
import { CatalogService, SearchResultEntry } from "catalog";
import { API_URL } from "../constants";
import { useOnMountUnsafe } from "../components/helper";
import { GeoResultMap } from "../components/GeoResultMap";
import { NotificationService } from "@open-pioneer/notifier";

export function GeoResultView() {
    const catalogSrvc = useService<CatalogService>("geonode-catalog.CatalogService");
    const notificationSrvc = useService<NotificationService>("notifier.NotificationService");

    const { id } = useParams();
    const [result, setResult] = useState<SearchResultEntry>();

    const [loading, setLoading] = useState<boolean>(false);

    useOnMountUnsafe(() => {
        if (id) {
            setLoading(true);
            catalogSrvc
                .loadResult(API_URL, id)
                .then((res) => {
                    setLoading(false);
                    setResult(res);
                })
                .catch((err) => {
                    setLoading(false);
                    notificationSrvc.notify({
                        level: "error",
                        title: "Error while loading result",
                        message: `Could not load the search result for id: ${id}`
                    });
                    console.error(err);
                });
        }
    });

    return (
        <>
            <Container maxW="8xl" height={"100%"} p={5}>
                <VStack gap="10px" align="stretch" height={"100%"}>
                    {loading && (
                        <Center height={"100%"}>
                            <CircularProgress isIndeterminate />
                        </Center>
                    )}
                    {result && <GeoResultMap result={result}></GeoResultMap>}
                </VStack>
            </Container>
        </>
    );
}
