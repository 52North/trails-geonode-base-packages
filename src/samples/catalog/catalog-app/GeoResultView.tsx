// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { useService } from "open-pioneer:react-hooks";
import {
    Box,
    Center,
    CircularProgress,
    HStack,
    Table,
    TableContainer,
    Tbody,
    Td,
    Text,
    Tr,
    VStack
} from "@open-pioneer/chakra-integration";
import { useParams } from "react-router";
import { useState } from "react";
import { NotificationService } from "@open-pioneer/notifier";
import { CatalogService } from "geonode-catalog/api";
import { SearchResultEntry } from "geonode-search/api";
import { useOnMountUnsafe } from "geonode-search/ui/helper";
import { GeoResultMap } from "./GeoResultMap";

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
                .loadResult(id)
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
        <Box width="100%" height="100%" p={5}>
            {loading && (
                <Center height="100%" width="100%">
                    <CircularProgress isIndeterminate />
                </Center>
            )}
            {result && (
                <VStack height="100%">
                    <Text fontSize="xl">{result.title}</Text>
                    <HStack width="100%" height="100%">
                        <Box flex="1" height="100%" width="100%">
                            <GeoResultMap result={result}></GeoResultMap>
                        </Box>
                        <Box flex="0 1 300px" height="100%">
                            <TableContainer>
                                <Table variant="striped">
                                    <Tbody>
                                        {showTableRow("Title", result.title)}
                                        {showTableRow(
                                            "Owner",
                                            `${result.owner?.firstName} ${result.owner?.lastName}`
                                        )}
                                        {showDateTableRow("Publication", result.date)}
                                        {showDateTableRow("Added to catalog", result.created)}
                                        {showDateTableRow(
                                            "Last catalog modifiction",
                                            result.lastUpdated
                                        )}
                                        {showTableRow("Resource type", result.type)}
                                        {showTableRow("Source", result.sourceType)}
                                        {showTableRow("Language", result.language)}
                                        {showTableRow(
                                            "Supplemental information",
                                            result.supplementalInformation
                                        )}
                                    </Tbody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </HStack>
                </VStack>
            )}
        </Box>
    );

    function showDateTableRow(label: string, value?: string) {
        if (value) {
            return showTableRow(
                label,
                `${new Date(value).toLocaleDateString()} ${new Date(value).toLocaleTimeString()}`
            );
        }
    }

    function showTableRow(label: string, value?: string | number) {
        if (value) {
            return (
                <Tr>
                    <Td>{label}</Td>
                    <Td>{value}</Td>
                </Tr>
            );
        } else {
            return <></>;
        }
    }
}
