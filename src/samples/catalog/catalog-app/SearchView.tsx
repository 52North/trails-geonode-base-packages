// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { useService } from "open-pioneer:react-hooks";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import {
    Box,
    Button,
    Center,
    Container,
    Grid,
    GridItem,
    Progress,
    Spacer,
    VStack
} from "@open-pioneer/chakra-integration";
import { SearchInput } from "geonode-search/ui/SearchInput";
import { SearchService } from "geonode-search/api";
import { useOnMountUnsafe } from "geonode-search/ui/helper";
import { InfinitePageLoad } from "geonode-search/ui/InfinitePageLoad";
import { Ordering } from "geonode-search/ui/Ordering";
import { PageSizeSelection } from "geonode-search/ui/PageSizeSelection";
import { ResultEntry } from "geonode-search/ui/ResultEntry";
import { FacetList } from "./FacetList";

export function SearchView() {
    const searchSrvc = useService<SearchService>("geonode-search.SearchService");
    const [results, loading, resultCount, currentFilter] = useReactiveSnapshot(
        () => [
            searchSrvc.results,
            searchSrvc.searching,
            searchSrvc.resultCount,
            searchSrvc.currentFilter
        ],
        [searchSrvc]
    );

    useOnMountUnsafe(() => searchSrvc.initSearch());

    return (
        <VStack gap="10px" align="stretch" overflow="hidden" height="100%">
            <Container maxW="8xl" p={5}>
                <SearchInput></SearchInput>
                {loading ? <Progress size="xs" isIndeterminate /> : <Box height="4px"></Box>}{" "}
                <Center gap={2}>
                    {clearActiveFilterButton()}
                    <Spacer></Spacer>
                    <Box>{<Box>{resultCount} Results found</Box>}</Box>
                    <PageSizeSelection></PageSizeSelection>
                    <Ordering></Ordering>
                </Center>
            </Container>
            <Container maxW="8xl" p={5} overflow="hidden">
                <Grid templateColumns="400px 1fr" gap={2} overflow="hidden" height="100%">
                    <GridItem w="100%" overflow="auto">
                        <FacetList facets={currentFilter.facets} />
                    </GridItem>
                    <GridItem w="100%" overflow="auto">
                        <VStack>
                            {results?.map((e) => (
                                <ResultEntry key={e.id} resultEntry={e}></ResultEntry>
                            ))}
                            <InfinitePageLoad></InfinitePageLoad>
                        </VStack>
                    </GridItem>
                </Grid>
            </Container>
        </VStack>
    );

    function clearActiveFilterButton() {
        return searchSrvc.hasActiveFilter ? (
            <Button colorScheme="blue" onClick={() => searchSrvc.clearAllFilter()}>
                Clear active Filter
            </Button>
        ) : (
            ""
        );
    }
}
