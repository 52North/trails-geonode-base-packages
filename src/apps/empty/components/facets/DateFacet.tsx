// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Facet } from "catalog";
import { useState } from "react";

import "react-datepicker/dist/react-datepicker.css";
import { Box, CloseButton, HStack, VStack } from "@open-pioneer/chakra-integration";
import { DatePicker } from "../ReactDatePicker";
import { SearchService } from "../../search-service";
import { useService } from "open-pioneer:react-hooks";

export function DateFacet(props: { facet: Facet }) {
    const { facet } = props;
    const searchSrvc = useService<SearchService>("SearchService");

    const [filterDate, setFilterDate] = useState<Date | null>(null);

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
