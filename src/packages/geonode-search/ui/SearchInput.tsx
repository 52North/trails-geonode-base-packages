// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import {
    Button,
    CloseButton,
    HStack,
    Input,
    InputGroup,
    InputRightElement
} from "@open-pioneer/chakra-integration";
import { useState } from "react";
import { useService } from "open-pioneer:react-hooks";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { SearchService } from "../api";

export function SearchInput() {
    const searchSrvc = useService<SearchService>("geonode-search.SearchService");

    const [searchTerm, setSearchTerm] = useState<string>("");

    useReactiveSnapshot(() => {
        if (searchSrvc.currentFilter.searchTerm) {
            setSearchTerm(searchSrvc.currentFilter.searchTerm);
        } else {
            setSearchTerm("");
        }
    }, [searchSrvc.currentFilter.searchTerm]);

    function triggerSearch(): void {
        searchSrvc.searchTerm = searchTerm;
    }

    function onKeyUp(evt: React.KeyboardEvent): void {
        if (evt.key === "Enter") {
            searchSrvc.searchTerm = searchTerm;
        }
    }

    function clearSearchTerm() {
        setSearchTerm("");
        searchSrvc.searchTerm = undefined;
    }

    return (
        <HStack>
            <InputGroup>
                <Input
                    placeholder="Search term"
                    onKeyUp={(evt) => onKeyUp(evt)}
                    value={searchTerm}
                    onChange={(evt) => setSearchTerm(evt.target.value)}
                />
                <InputRightElement>
                    {searchTerm && <CloseButton onClick={clearSearchTerm}></CloseButton>}
                </InputRightElement>
            </InputGroup>
            <Button colorScheme="blue" onClick={triggerSearch}>
                Search
            </Button>
        </HStack>
    );
}
