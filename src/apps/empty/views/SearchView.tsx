// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { useService } from "open-pioneer:react-hooks";
import { SearchService } from "../services/search-service";
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
import { SearchInput } from "../components/SearchInput";
import { ResultEntry } from "../components/ResultEntry";
import { PageSizeSelection } from "../components/PageSizeSelection";
import { InfinitePageLoad } from "../components/InfinitePageLoad";
import { Ordering } from "../components/Ordering";
import { useOnMountUnsafe } from "../components/helper";
import { FacetList } from "../components/facets/FacetList";

export function SearchView() {
    const searchSrvc = useService<SearchService>("SearchService");
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
