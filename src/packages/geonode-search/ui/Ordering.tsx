// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box, Select } from "@open-pioneer/chakra-integration";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useService } from "open-pioneer:react-hooks";
import { ChangeEvent } from "react";
import { SearchService } from "../api";

export function Ordering() {
    const searchSrvc = useService<SearchService>("geonode-search.SearchService");

    const [filter, orderOptions] = useReactiveSnapshot(
        () => [searchSrvc.currentFilter, searchSrvc.orderOptions],
        [searchSrvc]
    );

    function setOrder(evt: ChangeEvent<HTMLSelectElement>): void {
        const order = orderOptions?.find((opt) => opt.key === evt.target.value);
        if (order) {
            searchSrvc.order = order;
        }
    }

    return (
        <Box>
            <Select value={filter.order?.key} onChange={(evt) => setOrder(evt)}>
                {orderOptions?.map((e) => {
                    return (
                        <option key={e.key} value={e.key}>
                            {e.label}
                        </option>
                    );
                })}
            </Select>
        </Box>
    );
}
