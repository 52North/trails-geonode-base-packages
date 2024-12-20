// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box, Select } from "@open-pioneer/chakra-integration";
import { SearchService } from "../services/search-service";
import { useService } from "open-pioneer:react-hooks";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { ChangeEvent } from "react";

export function PageSizeSelection() {
    const searchSrvc = useService<SearchService>("SearchService");

    const [filter] = useReactiveSnapshot(() => [searchSrvc.currentFilter], [searchSrvc]);

    const options = [1, 5, 10, 20, 50];

    function setPageSize(evt: ChangeEvent<HTMLSelectElement>): void {
        const pageSize = evt.target.value;
        searchSrvc.pageSize = parseInt(pageSize, 10);
    }

    return (
        <Box>
            <Select value={filter.pageSize} onChange={(evt) => setPageSize(evt)}>
                {options.map((e) => {
                    return (
                        <option key={e} value={e}>
                            {e} per Page
                        </option>
                    );
                })}
            </Select>
        </Box>
    );
}
