// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    CatalogService,
    DateFacet,
    Facet,
    MultiSelectionFacetOption,
    MultiSelectionFacet,
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
    date?: string;
    created?: string;
    last_updated?: string;
    sourcetype?: string;
    supplemental_information?: string;
    language?: string;
    owner?: {
        pk?: number;
        username?: string;
        first_name?: string;
        last_name?: string;
        avatar?: string;
        is_superuser?: boolean;
        is_staff?: boolean;
        email?: string;
        link?: string;
    };
    links?: {
        extension: string;
        link_type: string;
        name: string;
        mime: string;
        url: string;
    }[];
}

interface GeonodeCatalogFacet extends Facet {
    addFilterParameter(params: URLSearchParams): void;
}

class GeonodeCatalogDateFacet extends DateFacet implements GeonodeCatalogFacet {
    private filterParam: string;

    constructor(key: string, label: string, filterParam: string) {
        super(key, label);
        this.filterParam = filterParam;
    }

    addFilterParameter(params: URLSearchParams): void {
        if (this.date) {
            params.append(this.filterParam, this.date.toISOString());
        }
    }
}

class GeonodeCatalogMultiSelectionFacet extends MultiSelectionFacet implements GeonodeCatalogFacet {
    private filterParam: string;
    private cbLoadOptions: (
        key: string,
        filter: SearchFilter
    ) => Promise<MultiSelectionFacetOption[]>;

    constructor(
        key: string,
        label: string,
        filterParam: string,
        cbLoadOptions: (key: string, filter: SearchFilter) => Promise<MultiSelectionFacetOption[]>
    ) {
        super(key, label);
        this.filterParam = filterParam;
        this.cbLoadOptions = cbLoadOptions;
    }

    addFilterParameter(params: URLSearchParams): void {
        if (this.selections.length) {
            this.selections.forEach((s) => params.append(this.filterParam, s));
        }
    }

    loadFacetOptions(filter: SearchFilter): Promise<MultiSelectionFacetOption[]> {
        return this.cbLoadOptions(this.key, filter);
    }
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

        filter.facets.forEach((facet) => (facet as GeonodeCatalogFacet).addFilterParameter(params));

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

    getFacets(url: string): Promise<Facet[]> {
        // TODO: ggf. von der API laden
        return new Promise<Facet[]>((resolve) =>
            resolve([
                new GeonodeCatalogMultiSelectionFacet(
                    "category",
                    "Category",
                    "filter{category.identifier.in}",
                    (key, filter) => this.loadFacetOptions(key, url, filter)
                ),
                new GeonodeCatalogMultiSelectionFacet(
                    "keyword",
                    "Keyword",
                    "filter{keywords.slug.in}",
                    (key, filter) => this.loadFacetOptions(key, url, filter)
                ),
                new GeonodeCatalogMultiSelectionFacet(
                    "region",
                    "Region",
                    "filter{regions.code.in}",
                    (key, filter) => this.loadFacetOptions(key, url, filter)
                ),
                new GeonodeCatalogMultiSelectionFacet(
                    "group",
                    "Group",
                    "filter{group.in}",
                    (key, filter) => this.loadFacetOptions(key, url, filter)
                ),
                new GeonodeCatalogMultiSelectionFacet(
                    "owner",
                    "Owner",
                    "filter{owner.pk.in}",
                    (key, filter) => this.loadFacetOptions(key, url, filter)
                ),
                new GeonodeCatalogDateFacet("date_from", "Date from", "filter{date.gte}"),
                new GeonodeCatalogDateFacet("date_to", "Date to", "filter{date.lte}")
            ])
        );
    }

    private loadFacetOptions(
        key: string,
        url: string,
        filter: SearchFilter
    ): Promise<MultiSelectionFacetOption[]> {
        const params = new URLSearchParams();

        if (filter.searchTerm) {
            params.set("search", filter.searchTerm);
            params.append("search_fields", "title");
            params.append("search_fields", "abstract");
        }

        params.set("page", "0");
        params.set("page_size", "10");

        filter.facets.forEach((facet) => (facet as GeonodeCatalogFacet).addFilterParameter(params));

        const fetchUrl = `${url}facets/${key}?${params}`;

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
        return {
            title: res.title,
            id: res.pk,
            imageUrl: res.thumbnail_url,
            abstract: res.abstract,
            type: res.resource_type,
            subType: res.subtype,
            extent: res.extent,
            alternate: res.alternate,
            links: res.links,
            date: res.date,
            created: res.created,
            lastUpdated: res.last_updated,
            owner: {
                firstName: res.owner?.first_name,
                lastName: res.owner?.last_name,
                username: res.owner?.username
            },
            sourceType: res.sourcetype,
            language: res.language,
            supplementalInformation: res.supplemental_information
        };
    }
}
