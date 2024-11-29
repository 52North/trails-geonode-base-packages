// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { CatalogService, SearchFilter, SearchResponse } from "./CatalogService";
import type { ServiceOptions } from "@open-pioneer/runtime";
import { HttpService } from "@open-pioneer/http";

interface References {
    httpService: HttpService;
}

export class GeonodeCatalogServiceImpl implements CatalogService {
    private httpService: HttpService;

    constructor(serviceOptions: ServiceOptions<References>) {
        this.httpService = serviceOptions.references.httpService;
    }

    startSearch(url: string, filter: SearchFilter): Promise<SearchResponse> {
        const params = new URLSearchParams();
        params.set("search", "test");
        params.append("search_fields", "title");
        params.append("search_fields", "abstract");
        params.set("page_size", "20");
        const fetchUrl = `${url}resources?${params}`;

        return this.httpService
            .fetch(fetchUrl)
            .then((response) => response.json())
            .then((response) => {
                debugger;
                return {
                    count: response.total,
                    results: []
                };
            });
        // TODO: how error handling:
        // .catch((error) => {
        //     debugger;
        // });
    }
}
