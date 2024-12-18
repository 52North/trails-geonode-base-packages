// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Reactive, reactive } from "@conterra/reactivity-core";
import { DeclaredService, ServiceOptions } from "@open-pioneer/runtime";
import {
    CatalogService,
    Facet,
    FacetDate,
    FacetOption,
    OrderOption,
    SearchFilter,
    SearchResultEntry
} from "catalog";
import { API_URL } from "./constants";
import { NotificationService } from "@open-pioneer/notifier";

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
    set pageSize(pageSize: number);
    set searchTerm(searchTerm: string | undefined);
    set order(order: OrderOption);
    addNextPage(): void;
    getOrderOptions(): Promise<OrderOption[]>;
    getFacetOptions(facet: Facet): Promise<FacetOption[]>;
    isFacetOptionSelected(facet: Facet, option: FacetOption): boolean;
    toggleFacetOption(facet: Facet, option: FacetOption): void;
    setDateFacet(facet: Facet, date: Date | null): void;
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
        this.triggerSearch();
        this.catalogSrvc.getFacets().then((facets) => (this.#facets.value = facets));
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

    toggleFacetOption(facet: Facet, selection: FacetOption): void {
        const entryIdx = this.#currentFilter.facets?.findIndex(
            (e) => e.facet.key === facet.key && e.selection.key === selection.key
        );
        if (entryIdx >= 0) {
            this.#currentFilter.facets = this.#currentFilter.facets.filter(
                (f, i) => i !== entryIdx
            );
        } else {
            this.#currentFilter.facets.push({
                facet,
                selection
            });
        }
        this.triggerSearch();
    }

    setDateFacet(facet: Facet, date: Date | null): void {
        const entryIdx = this.#currentFilter.facets?.findIndex((e) => e.facet.key === facet.key);
        if (entryIdx >= 0) {
            if (date) {
                this.#currentFilter.facets[entryIdx]!.selection = {
                    key: facet.key,
                    date: date
                } as FacetDate;
            } else {
                this.#currentFilter.facets = this.#currentFilter.facets.filter(
                    (f, i) => i !== entryIdx
                );
            }
        } else {
            this.#currentFilter.facets.push({
                facet,
                selection: {
                    key: facet.key,
                    date: date
                } as FacetDate
            });
        }
        this.triggerSearch();
    }

    isFacetOptionSelected(facet: Facet, selection: FacetOption): boolean {
        const entryIdx = this.#currentFilter.facets?.findIndex(
            (e) => e.facet.key === facet.key && e.selection.key === selection.key
        );
        return entryIdx >= 0;
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

    getFacetOptions(facet: Facet): Promise<FacetOption[]> {
        return this.catalogSrvc.loadFacetOptions(facet, API_URL, this.#currentFilter);
    }

    private triggerSearch(appendResults: boolean = false) {
        this.#searching.value = true;
        if (!appendResults) {
            this.#results.value = undefined;
        }
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
}
