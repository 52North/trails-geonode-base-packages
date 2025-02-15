// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Button, Center, CircularProgress } from "@open-pioneer/chakra-integration";
import { useService } from "open-pioneer:react-hooks";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { SearchService } from "../api";

export function InfinitePageLoad() {
    const searchSrvc = useService<SearchService>("geonode-search.SearchService");

    const [loading] = useReactiveSnapshot(
        () => [searchSrvc.searching, searchSrvc.resultCount],
        [searchSrvc]
    );

    return (
        <Center>
            {loading ? (
                <CircularProgress isIndeterminate color="blue.600" />
            ) : (
                <Button colorScheme="blue" onClick={() => searchSrvc.addNextPage()}>
                    Load more
                </Button>
            )}
        </Center>
    );
}
