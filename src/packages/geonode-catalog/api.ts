// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { DeclaredService } from "@open-pioneer/runtime";
import {
    Facet,
    OrderOption,
    SearchFilter,
    SearchResponse,
    SearchResultEntry
} from "geonode-search/api";

export * from "./api/permission";
export * from "./api/resource";
export * from "./api/geo";

export interface CatalogService extends DeclaredService<"geonode-catalog.CatalogService"> {
    startSearch(filter: SearchFilter): Promise<SearchResponse>;
    loadResult(id: string): Promise<SearchResultEntry>;
    getOrderOptions(): Promise<OrderOption[]>;
    getFacets(): Promise<Facet[]>;
}
