// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Reactive, reactive } from "@conterra/reactivity-core";
import { DeclaredService, ServiceOptions } from "@open-pioneer/runtime";
import { CatalogService, Facet, OrderOption, SearchFilter, SearchResultEntry } from "catalog";
import { NotificationService } from "@open-pioneer/notifier";
import { API_URL, URL_PARAM_SEARCH_TERM } from "../constants";

interface References {
    catalogService: CatalogService;
    notificationService: NotificationService;
}

export interface SearchService extends DeclaredService<"SearchService"> {
    searching: boolean;
    results: SearchResultEntry[] | undefined;
    resultCount: number;
    currentFilter: SearchFilter;
    facets: Facet[];
    hasActiveFilter: boolean;
    set pageSize(pageSize: number);
    set searchTerm(searchTerm: string | undefined);
    set order(order: OrderOption);
    initSearch(): void;
    startSearch(): void;
    addNextPage(): void;
    clearAllFilter(): void;
    getOrderOptions(): Promise<OrderOption[]>;
}

export class SearchServiceImpl implements SearchService {
    private catalogSrvc: CatalogService;
    private notificationSrvc: NotificationService;

    #searching: Reactive<boolean> = reactive(false);

    #results: Reactive<SearchResultEntry[] | undefined> = reactive();

    #resultCount: Reactive<number> = reactive(0);

    #facets: Reactive<Facet[]> = reactive([]);

    #currentFilter: SearchFilter = {
        pageSize: 5,
        page: 1,
        facets: []
    };

    constructor(serviceOptions: ServiceOptions<References>) {
        this.catalogSrvc = serviceOptions.references.catalogService;
        this.notificationSrvc = serviceOptions.references.notificationService;
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

    get facets(): Facet[] {
        return this.#facets.value;
    }

    set searchTerm(term: string | undefined) {
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

    get hasActiveFilter() {
        const activeFacets = this.#currentFilter.facets.some((facet) => facet.hasActiveFilter());
        return activeFacets || this.#currentFilter.searchTerm !== undefined;
    }

    clearAllFilter(): void {
        this.#currentFilter.searchTerm = undefined;
        this.#currentFilter.facets.forEach((facet) => facet.clearFilter());
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
        return this.catalogSrvc.getOrderOptions(API_URL);
    }

    startSearch(): void {
        this.triggerSearch();
    }

    private triggerSearch(appendResults: boolean = false) {
        this.#searching.value = true;
        if (!appendResults) {
            this.#results.value = undefined;
        }
        this.setUrlParams();
        this.catalogSrvc
            .startSearch(API_URL, this.#currentFilter)
            .then((res) => {
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
            })
            .catch((err) => {
                console.error(err);
                this.notificationSrvc.notify({
                    level: "error",
                    message: "Error while requesting search results",
                    title: "No search results"
                });
                this.#searching.value = false;
            });
    }

    initSearch(): void {
        const url = new URL(window.location.href);
        const searchTerm = url.searchParams.get(URL_PARAM_SEARCH_TERM);
        if (searchTerm) {
            this.#currentFilter.searchTerm = searchTerm;
        }
        this.catalogSrvc.getFacets(API_URL).then((facets) => {
            this.#currentFilter.facets = facets;
            this.#facets.value = facets;
            facets.forEach((facet) => facet.applyOfSearchParams(url.searchParams));
            this.triggerSearch();
        });
    }

    private setUrlParams() {
        const searchParams = new URLSearchParams();

        if (this.#currentFilter.searchTerm) {
            searchParams.set(URL_PARAM_SEARCH_TERM, this.#currentFilter.searchTerm);
        }

        this.#currentFilter.facets.forEach((facet) => {
            if (facet.hasActiveFilter()) {
                facet.appendSearchParams(searchParams);
            }
        });
        const location = window.location;
        let url = location.origin;
        if (searchParams.size > 0) {
            url += `?${searchParams.toString()}`;
        }
        window.history.pushState(null, "", url);
    }
}
