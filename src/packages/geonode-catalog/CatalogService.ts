// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { DeclaredService } from "@open-pioneer/runtime";

export interface SearchResultEntry {
    title: string;
}

export interface SearchResponse {
    count?: number;
    results?: SearchResultEntry[];
}

export interface SearchFilter {
    searchTerm?: string;
}

export interface CatalogService extends DeclaredService<"geonode-catalog.CatalogService"> {
    startSearch(url: string, filter: SearchFilter): Promise<SearchResponse>;
}
