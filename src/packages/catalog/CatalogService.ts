// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { DeclaredService } from "@open-pioneer/runtime";

export interface SearchResultEntry {
    id: string;
    title: string;
    imageUrl?: string;
    abstract: string;
}

export interface SearchResponse {
    count?: number;
    results?: SearchResultEntry[];
}

export interface OrderOption {
    key: string;
    label: string;
}

export interface FacetOption {
    key: string;
    label: string;
    count?: number;
}

export interface Facet {
    key: string;
    label: string;
    type: "multiString";
}

export interface SearchFilter {
    searchTerm?: string;
    pageSize?: number;
    page?: number;
    order?: OrderOption;
    facets: {
        facet: Facet;
        option: FacetOption;
    }[];
}

export interface CatalogService extends DeclaredService<"geonode-catalog.CatalogService"> {
    startSearch(url: string, filter: SearchFilter): Promise<SearchResponse>;
    getOrderOptions(url: string): Promise<OrderOption[]>;
    getFacets(): Promise<Facet[]>;
    loadFacetOptions(facet: Facet, url: string, filter: SearchFilter): Promise<FacetOption[]>;
}
