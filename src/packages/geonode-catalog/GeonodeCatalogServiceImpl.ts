// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    CatalogService,
    Facet,
    FacetOption,
    OrderOption,
    SearchFilter,
    SearchResponse,
    SearchResultEntry
} from "catalog";
import type { ServiceOptions } from "@open-pioneer/runtime";
import { HttpService } from "@open-pioneer/http";

interface References {
    httpService: HttpService;
}

interface GeonodeResource {
    title: string;
    pk: string;
    thumbnail_url: string;
    abstract: string;
}

interface ExtendedFacet extends Facet {
    filterParam: string;
}

export class GeonodeCatalogServiceImpl implements CatalogService {
    private httpService: HttpService;

    constructor(serviceOptions: ServiceOptions<References>) {
        this.httpService = serviceOptions.references.httpService;
    }

    startSearch(url: string, filter: SearchFilter): Promise<SearchResponse> {
        const params = new URLSearchParams();

        if (filter.searchTerm) {
            params.set("search", filter.searchTerm);
            params.append("search_fields", "title");
            params.append("search_fields", "abstract");
        }

        if (filter.pageSize !== undefined) {
            params.set("page_size", `${filter.pageSize}`);
        }

        if (filter.page !== undefined) {
            params.set("page", `${filter.page}`);
        }

        if (filter.order !== undefined) {
            params.set("sort[]", filter.order.key);
        }

        if (filter.facets.length) {
            filter.facets.forEach((e) => {
                if (e.facet.type === "multiString") {
                    const facet = e.facet as ExtendedFacet;
                    params.append(facet.filterParam, e.option.key);
                }
            });
        }

        params.set("api_preset", "catalog_list");
        // params.set("include[]", "keywords");
        params.set("filter{metadata_only}", "false");

        const fetchUrl = `${url}resources?${params}`;

        return this.httpService
            .fetch(fetchUrl)
            .then((response) => response.json())
            .then((response) => {
                return {
                    count: response.total,
                    results: response.resources.map((e: GeonodeResource) => this.parseResult(e))
                };
            });
        // TODO: how error handling:
        // .catch((error) => {
        //     debugger;
        // });
    }

    getOrderOptions(): Promise<OrderOption[]> {
        return new Promise<OrderOption[]>((resolve) =>
            resolve([
                {
                    key: "-date",
                    label: "Most recent"
                },
                {
                    key: "date",
                    label: "Less recent"
                },
                {
                    key: "title",
                    label: "A-Z"
                },
                {
                    key: "-title",
                    label: "Z-A"
                }
            ])
        );
    }

    getFacets(): Promise<ExtendedFacet[]> {
        // TODO: ggf. von der API laden
        return new Promise<ExtendedFacet[]>((resolve) =>
            resolve([
                {
                    key: "keyword",
                    type: "multiString",
                    label: "Keyword",
                    filterParam: "filter{keywords.slug.in}"
                },
                {
                    key: "region",
                    type: "multiString",
                    label: "Region",
                    filterParam: "filter{regions.code.in}"
                },
                {
                    key: "owner",
                    type: "multiString",
                    label: "Owner",
                    filterParam: "filter{owner.pk.in}"
                }
            ])
        );
    }

    loadFacetOptions(
        facet: ExtendedFacet,
        url: string,
        filter: SearchFilter
    ): Promise<FacetOption[]> {
        const params = new URLSearchParams();

        params.set("page", "0");
        params.set("page_size", "10");

        if (filter.facets.length) {
            filter.facets.forEach((e) => {
                if (e.facet.type === "multiString") {
                    const facet = e.facet as ExtendedFacet;
                    params.append(facet.filterParam, e.option.key);
                }
            });
        }

        const fetchUrl = `${url}facets/${facet.key}?${params}`;

        return this.httpService
            .fetch(fetchUrl)
            .then((response) => response.json())
            .then((response) => {
                if (response.topics.items) {
                    return response.topics.items;
                } else {
                    return [];
                }
            });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private parseResult(res: GeonodeResource): SearchResultEntry {
        return {
            title: res.title,
            id: res.pk,
            imageUrl: res.thumbnail_url,
            abstract: res.abstract
        };
    }
}
