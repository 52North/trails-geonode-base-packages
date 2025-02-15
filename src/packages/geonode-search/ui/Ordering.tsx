// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box, Select } from "@open-pioneer/chakra-integration";
import { useService } from "open-pioneer:react-hooks";
import { ChangeEvent, useEffect, useState } from "react";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { OrderOption, SearchService } from "../api";

export function Ordering() {
    const searchSrvc = useService<SearchService>("geonode-search.SearchService");

    const [orderOptions, setOrderOptions] = useState<OrderOption[]>([]);
    const [filter] = useReactiveSnapshot(() => [searchSrvc.currentFilter], [searchSrvc]);

    useEffect(() => {
        searchSrvc.getOrderOptions().then((orderOptions) => setOrderOptions(orderOptions));
    });

    function setOrder(evt: ChangeEvent<HTMLSelectElement>): void {
        const order = orderOptions.find((opt) => opt.key === evt.target.value);
        if (order) {
            searchSrvc.order = order;
        }
    }

    return (
        <Box>
            <Select value={filter.order?.key} onChange={(evt) => setOrder(evt)}>
                {orderOptions.map((e) => {
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
