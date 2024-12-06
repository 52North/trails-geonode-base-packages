// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    CatalogService,
    OrderOption,
    SearchFilter,
    SearchResponse,
    SearchResultEntry
} from "./CatalogService";
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

        params.set("api_preset", "catalog_list");

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
