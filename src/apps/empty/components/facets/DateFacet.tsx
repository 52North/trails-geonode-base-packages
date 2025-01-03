// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Facet, FacetDate } from "catalog";
import { useState } from "react";

import "react-datepicker/dist/react-datepicker.css";
import { Box, CloseButton, HStack, VStack } from "@open-pioneer/chakra-integration";
import { DatePicker } from "../ReactDatePicker";
import { useService } from "open-pioneer:react-hooks";
import { SearchService } from "../../services/search-service";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";

export function DateFacet(props: { facet: Facet }) {
    const { facet } = props;
    const searchSrvc = useService<SearchService>("SearchService");

    const [filterDate, setFilterDate] = useState<Date | null>(null);

    useReactiveSnapshot(() => {
        const match = searchSrvc.currentFilter.facets.find((e) => e.facet.key === facet.key);
        if (match) {
            const temp = (match.selection as FacetDate).date;
            setFilterDate(temp);
        }
    }, [facet.key, searchSrvc.currentFilter.facets]);

    function adjustDateFilter(date: Date | null): void {
        setFilterDate(date);
        searchSrvc.setDateFacet(facet, date);
    }

    return (
        <VStack>
            <Box>
                {filterDate ? (
                    <HStack alignItems={"center"}>
                        <Box>
                            {new Intl.DateTimeFormat("de", {
                                day: "numeric",
                                year: "numeric",
                                month: "numeric"
                            }).format(filterDate)}
                        </Box>
                        <CloseButton onClick={() => adjustDateFilter(null)} size={"sm"} />
                    </HStack>
                ) : (
                    <Box>No Date selected</Box>
                )}
            </Box>
            <DatePicker
                value={filterDate}
                onChange={(date) => {
                    if (date) {
                        adjustDateFilter(date);
                    }
                }}
            ></DatePicker>
        </VStack>
    );
}
