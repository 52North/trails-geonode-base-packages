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
import { FacetComp } from "../components/facets/Facet";
import { useOnMountUnsafe } from "../components/helper";

export function SearchView() {
    const searchSrvc = useService<SearchService>("SearchService");
    const [results, loading, resultCount, facets] = useReactiveSnapshot(
        () => [searchSrvc.results, searchSrvc.searching, searchSrvc.resultCount, searchSrvc.facets],
        [searchSrvc]
    );

    useOnMountUnsafe(() => searchSrvc.initSearch());

    return (
        <Container maxW="8xl" p={5}>
            <VStack gap="10px" align="stretch">
                <SearchInput></SearchInput>
                {loading ? <Progress size="xs" isIndeterminate /> : <Box height="4px"></Box>}{" "}
                <Center gap={2}>
                    {clearActiveFilterButton()}
                    <Spacer></Spacer>
                    <Box>{<Box>{resultCount} Results found</Box>}</Box>
                    <PageSizeSelection></PageSizeSelection>
                    <Ordering></Ordering>
                </Center>
                <Grid templateColumns="400px 1fr" gap={2}>
                    <GridItem w="100%">
                        {facets?.map((f) => <FacetComp key={f.key} facet={f}></FacetComp>)}
                    </GridItem>
                    <GridItem w="100%">
                        <VStack>
                            {results?.map((e) => (
                                <ResultEntry key={e.id} resultEntry={e}></ResultEntry>
                            ))}
                            <InfinitePageLoad></InfinitePageLoad>
                        </VStack>
                    </GridItem>
                </Grid>
            </VStack>
        </Container>
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
