// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { useService } from "open-pioneer:react-hooks";
import { SearchService } from "../search-service";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { Box, Center, Container, Progress, VStack } from "@open-pioneer/chakra-integration";
import { SearchInput } from "./SearchInput";
import { ResultEntry } from "./ResultEntry";
import { PageSizeSelection } from "./PageSizeSelection";
import { InfinitePageLoad } from "./InfinitePageLoad";
import { Ordering } from "./Ordering";

export function SearchView() {
    const searchSrvc = useService<SearchService>("SearchService");
    const [results, loading, resultCount] = useReactiveSnapshot(
        () => [searchSrvc.results, searchSrvc.searching, searchSrvc.resultCount],
        [searchSrvc]
    );

    return (
        <Container maxW="6xl">
            <VStack gap="10px" align="stretch">
                <SearchInput></SearchInput>
                {loading ? <Progress size="xs" isIndeterminate /> : <Box height="4px"></Box>}
                <Center gap={2}>
                    <Box>{<Box>{resultCount} Results found</Box>}</Box>
                    <PageSizeSelection></PageSizeSelection>
                    <Ordering></Ordering>
                </Center>

                <VStack>
                    {results?.map((e) => <ResultEntry key={e.id} resultEntry={e}></ResultEntry>)}
                </VStack>

                <InfinitePageLoad></InfinitePageLoad>
            </VStack>
        </Container>
    );
}
