// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import "react-datepicker/dist/react-datepicker.css";
import { Box, CloseButton, HStack, VStack } from "@open-pioneer/chakra-integration";
import { DatePicker } from "../ReactDatePicker";
import { useService } from "open-pioneer:react-hooks";
import { SearchService, DateFacet } from "../../api";

export function DateFacetComp(props: { dateFacet: DateFacet }) {
    const { dateFacet } = props;
    const searchSrvc = useService<SearchService>("geonode-search.SearchService");

    function adjustDateFilter(date: Date | null): void {
        dateFacet.setDate(date);
        searchSrvc.startSearch();
    }

    return (
        <VStack>
            <Box>
                {dateFacet.getDate() ? (
                    <HStack alignItems={"center"}>
                        <Box>
                            {new Intl.DateTimeFormat("de", {
                                day: "numeric",
                                year: "numeric",
                                month: "numeric"
                            }).format(dateFacet.getDate()!)}
                        </Box>
                        <CloseButton onClick={() => adjustDateFilter(null)} size={"sm"} />
                    </HStack>
                ) : (
                    <Box>No Date selected</Box>
                )}
            </Box>
            <DatePicker
                value={dateFacet.getDate()}
                onChange={(date) => {
                    if (date) {
                        adjustDateFilter(date);
                    }
                }}
            ></DatePicker>
        </VStack>
    );
}
