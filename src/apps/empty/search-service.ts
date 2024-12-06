// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Reactive, reactive } from "@conterra/reactivity-core";
import { DeclaredService, ServiceOptions } from "@open-pioneer/runtime";
import { CatalogService, OrderOption, SearchFilter, SearchResultEntry } from "catalog";
import { API_URL } from "./constants";

interface References {
    catalogService: CatalogService;
}

export interface SearchService extends DeclaredService<"SearchService"> {
    searching: boolean;
    results: SearchResultEntry[] | undefined;
    resultCount: number;
    currentFilter: SearchFilter;
    set pageSize(pageSize: number);
    set searchTerm(v: string);
    set order(order: OrderOption);
    addNextPage(): void;
    getOrderOptions(): Promise<OrderOption[]>;
}

export class SearchServiceImpl implements SearchService {
    private catalogSrvc: CatalogService;

    #searching: Reactive<boolean> = reactive(false);

    #results: Reactive<SearchResultEntry[] | undefined> = reactive();

    #resultCount: Reactive<number> = reactive(0);

    #currentFilter: SearchFilter = {
        pageSize: 5,
        page: 1
    };

    constructor(serviceOptions: ServiceOptions<References>) {
        this.catalogSrvc = serviceOptions.references.catalogService;
        this.triggerSearch();
    }

    get searching(): boolean {
        return this.#searching.value;
    }

    get results(): SearchResultEntry[] | undefined {
        return this.#results.value;
    }

    get resultCount(): number {
        return this.#resultCount.value;
    }

    get currentFilter(): SearchFilter {
        return this.#currentFilter;
    }

    set searchTerm(term: string) {
        this.#currentFilter.searchTerm = term;
        this.triggerSearch();
    }

    set pageSize(pageSize: number) {
        this.#currentFilter.pageSize = pageSize;
        this.triggerSearch();
    }

    set order(order: OrderOption) {
        this.#currentFilter.order = order;
        this.triggerSearch();
    }

    addNextPage(): void {
        console.log("start loading next page");
        if (!this.#searching.value && this.#currentFilter.page !== undefined) {
            this.#currentFilter.page = this.#currentFilter.page + 1;
            this.triggerSearch(true);
        }
    }

    getOrderOptions(): Promise<OrderOption[]> {
        return this.catalogSrvc.getOrderOptions();
    }

    private triggerSearch(appendResults: boolean = false) {
        this.#searching.value = true;
        if (!appendResults) {
            this.#results.value = undefined;
        }
        const url = API_URL;
        this.catalogSrvc.startSearch(url, this.#currentFilter).then((res) => {
            console.log(`Search results ${res.count}`);
            if (appendResults && this.#results.value && res.results) {
                this.#results.value = this.#results.value.concat(res.results);
            } else {
                this.#results.value = res.results;
            }
            if (res.count !== undefined) {
                this.#resultCount.value = res.count;
            }
            this.#searching.value = false;
        });
    }
}
