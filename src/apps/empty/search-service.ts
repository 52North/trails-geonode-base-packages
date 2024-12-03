// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Reactive, reactive } from "@conterra/reactivity-core";
import { DeclaredService, ServiceOptions } from "@open-pioneer/runtime";
import { CatalogService, SearchFilter, SearchResponse } from "geonode-catalog";
import { API_URL } from "./constants";

interface References {
    catalogService: CatalogService;
}

export interface SearchService extends DeclaredService<"SearchService"> {
    searching: boolean;
    result: SearchResponse | null;
    set searchTerm(v: string);
}

export class SearchServiceImpl implements SearchService {
    private catalogSrvc: CatalogService;

    #searching: Reactive<boolean> = reactive(false);

    #result: Reactive<SearchResponse | null> = reactive(null);

    #currentFilter: SearchFilter = {};

    constructor(serviceOptions: ServiceOptions<References>) {
        this.catalogSrvc = serviceOptions.references.catalogService;
        this.triggerSearch();
    }

    get searching(): boolean {
        return this.#searching.value;
    }

    get result(): SearchResponse | null {
        return this.#result.value;
    }

    set searchTerm(term: string) {
        this.#currentFilter.searchTerm = term;
        this.triggerSearch();
    }

    private triggerSearch() {
        this.#searching.value = true;
        this.#result.value = null;
        const url = API_URL;
        this.catalogSrvc.startSearch(url, this.#currentFilter).then((res) => {
            console.log(`Search results ${res.count}`);
            this.#result.value = res;
            this.#searching.value = false;
        });
    }
}
