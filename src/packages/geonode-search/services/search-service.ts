// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Reactive, reactive } from "@conterra/reactivity-core";
import { ServiceOptions } from "@open-pioneer/runtime";
import { CatalogService } from "geonode-catalog/api";
import { GeoNodeConfigService } from "geonode-core";
import { NotificationService } from "@open-pioneer/notifier";
import { SearchResultEntry, SearchFilter, OrderOption, SearchService } from "../api";

const URL_PARAM_SEARCH_TERM = "searchTerm";

interface References {
    catalogService: CatalogService;
    configService: GeoNodeConfigService;
    notificationService: NotificationService;
}

export class SearchServiceImpl implements SearchService {
    private catalogSrvc: CatalogService;
    private configSrvc: GeoNodeConfigService;
    private notificationSrvc: NotificationService;

    #searching: Reactive<boolean> = reactive(false);

    #results: Reactive<SearchResultEntry[] | undefined> = reactive();

    #resultCount: Reactive<number> = reactive(0);

    #currentFilter: SearchFilter = {
        pageSize: 5,
        page: 1,
        facets: []
    };

    constructor(serviceOptions: ServiceOptions<References>) {
        this.catalogSrvc = serviceOptions.references.catalogService;
        this.notificationSrvc = serviceOptions.references.notificationService;
        this.configSrvc = serviceOptions.references.configService;
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
        return this.catalogSrvc.getOrderOptions();
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
            .startSearch(this.#currentFilter)
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

        this.catalogSrvc.getFacets().then((facets) => {
            this.#currentFilter.facets = facets;
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
        const url = new URL(location.toString());
        if (searchParams.size > 0) {
            url.search = `?${searchParams.toString()}`;
        }
        window.history.pushState(null, "", url);
    }
}
