// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    CatalogService,
    Facet,
    FacetDate,
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
    resource_type: string;
    subtype?: string;
    extent?: {
        coords: number[];
        srid: string;
    };
    alternate?: string;
    links?: {
        extension: string;
        link_type: string;
        name: string;
        mime: string;
        url: string;
    }[];
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
                const { filterParam } = e.facet as ExtendedFacet;
                if (e.facet.type === "multiString") {
                    params.append(filterParam, e.selection.key);
                }
                if (e.facet.type === "date") {
                    const option = e.selection as FacetDate;
                    params.append(filterParam, option.date.toISOString());
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
                    key: "category",
                    type: "multiString",
                    label: "Category",
                    filterParam: "filter{category.identifier.in}"
                },
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
                    key: "group",
                    type: "multiString",
                    label: "Group",
                    filterParam: "filter{group.in}"
                },
                {
                    key: "owner",
                    type: "multiString",
                    label: "Owner",
                    filterParam: "filter{owner.pk.in}"
                },
                {
                    key: "date_from",
                    type: "date",
                    label: "Date from",
                    filterParam: "filter{date.gte}"
                },
                {
                    key: "date_to",
                    type: "date",
                    label: "Date to",
                    filterParam: "filter{date.lte}"
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
                    const { filterParam } = e.facet as ExtendedFacet;
                    params.append(filterParam, e.selection.key);
                }
                if (e.facet.type === "date") {
                    const { filterParam } = e.facet as ExtendedFacet;
                    const { date } = e.selection as FacetDate;
                    params.append(filterParam, date.toISOString());
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

    loadResult(url: string, id: string): Promise<SearchResultEntry> {
        const fetchUrl = `${url}resources/${id}`;
        return this.httpService
            .fetch(fetchUrl)
            .then((response) => response.json())
            .then((response) => {
                if (response.resource) {
                    return this.parseResult(response.resource);
                } else {
                    throw new Error("Could not parse result.");
                }
            });
    }

    private parseResult(res: GeonodeResource): SearchResultEntry {
        console.log(res);
        return {
            title: res.title,
            id: res.pk,
            imageUrl: res.thumbnail_url,
            abstract: res.abstract,
            type: res.resource_type,
            subType: res.subtype,
            extent: res.extent,
            alternate: res.alternate,
            links: res.links
        };
    }
}
