// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { useService } from "open-pioneer:react-hooks";
import { SearchService } from "../search-service";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { Box, Center, Container, Progress, VStack } from "@open-pioneer/chakra-integration";
import { SearchInput } from "./SearchInput";
import { ResultEntry } from "./ResultEntry";

export function SearchView() {
    const searchSrvc = useService<SearchService>("SearchService");
    const [result, loading] = useReactiveSnapshot(
        () => [searchSrvc.result, searchSrvc.searching],
        [searchSrvc]
    );

    return (
        <Container maxW="6xl">
            <SearchInput></SearchInput>
            {loading && <Progress size="xs" isIndeterminate />}
            <Center>{result && <Box>{result.count} Results found</Box>}</Center>

            <VStack>
                {result?.results?.map((e) => (
                    <ResultEntry key={e.uuid} resultEntry={e}></ResultEntry>
                ))}
            </VStack>
        </Container>
    );
}
