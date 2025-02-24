// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { useService } from "open-pioneer:react-hooks";
import { Container, VStack } from "@open-pioneer/chakra-integration";
import { useParams } from "react-router";
import { useState } from "react";
import { CatalogService } from "geonode-catalog/api";
import { useOnMountUnsafe } from "./helper";
import { SearchResultEntry } from "../api";

export function GeoResultView() {
    const catalogSrvc = useService<CatalogService>("geonode-catalog.CatalogService");
    const { id } = useParams();
    const [result, setResult] = useState<SearchResultEntry>();

    useOnMountUnsafe(() => {
        if (id) {
            catalogSrvc
                .loadResult(id)
                .then((res) => setResult(res))
                .catch((err) => console.error(err));
        }
    });

    return (
        <>
            <Container maxW="8xl">
                <VStack gap="10px" align="stretch">
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                </VStack>
            </Container>
        </>
    );
}
