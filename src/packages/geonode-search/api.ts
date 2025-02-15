// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { DeclaredService } from "@open-pioneer/runtime";

import { GeometryExtent, Owner } from "geonode-catalog/api";

// export enum ResultType {
//     DATASET = "dataset",
//     DOCUMENT = "document",
//     MAP = "map",
//     GEOSTORY = "geostory"
// }
export interface SearchResultEntry {
    id: string;
    title: string;
    imageUrl?: string;
    abstract: string;
    type: string;
    subType?: string;
    alternate?: string;
    date?: string;
    created?: string;
    lastUpdated?: string;
    owner?: Owner;
    sourceType?: string;
    language?: string;
    supplementalInformation?: string;
    extent?: {
        coords: number[];
        srid: string;
    };
    links?: {
        extension: string;
        link_type: string;
        name: string;
        mime: string;
        url: string;
    }[];
}

export interface SearchResponse {
    count?: number;
    results?: SearchResultEntry[];
}

export interface OrderOption {
    key: string;
    label: string;
}

export abstract class Facet {
    key: string;
    label: string;

    constructor(key: string, label: string) {
        this.key = key;
        this.label = label;
    }

    protected get paramKey() {
        return `facet_${this.key}`;
    }

    abstract hasActiveFilter(): boolean;

    abstract appendSearchParams(params: URLSearchParams): void;

    abstract applyOfSearchParams(params: URLSearchParams): void;

    abstract clearFilter(): void;
}

export abstract class DateFacet extends Facet {
    protected date: Date | null = null;

    setDate(date: Date | null): void {
        this.date = date;
    }

    getDate(): Date | null {
        return this.date;
    }

    clearFilter(): void {
        this.date = null;
    }

    hasActiveFilter(): boolean {
        return this.date !== null;
    }

    appendSearchParams(params: URLSearchParams): void {
        if (this.date) {
            params.append(this.paramKey, this.date?.toISOString());
        }
    }

    applyOfSearchParams(params: URLSearchParams): void {
        const matchedParams = params.getAll(this.paramKey);
        if (matchedParams.length === 1) {
            const dateStr = matchedParams[0];
            if (typeof dateStr === "string") {
                this.date = new Date(dateStr);
            }
        }
    }
}

export interface MultiSelectionFacetOption {
    key: string;
    label: string;
    count?: number;
}

export abstract class MultiSelectionFacet extends Facet {
    protected selections: string[] = [];

    abstract loadFacetOptions(filter: SearchFilter): Promise<MultiSelectionFacetOption[]>;

    toggleOption(option: MultiSelectionFacetOption): void {
        const entryIdx = this.selections.findIndex((o) => o === option.key);
        if (entryIdx >= 0) {
            this.selections = this.selections.filter((f, i) => i !== entryIdx);
        } else {
            this.selections.push(option.key);
        }
    }

    isOptionSelected(option: MultiSelectionFacetOption): boolean {
        return this.selections.findIndex((o) => o === option.key) >= 0;
    }

    hasActiveFilter(): boolean {
        return this.selections.length > 0;
    }

    clearFilter(): void {
        this.selections = [];
    }

    appendSearchParams(urlParams: URLSearchParams): void {
        this.selections.forEach((o) => urlParams.append(this.paramKey, o));
    }

    applyOfSearchParams(params: URLSearchParams): void {
        const matchedParams = params.getAll(this.paramKey);
        if (matchedParams.length) {
            matchedParams.forEach((e) => this.selections.push(e));
        }
    }
}

export abstract class GeometryExtentFacet extends Facet {
    protected extent?: GeometryExtent;

    hasActiveFilter(): boolean {
        return this.extent !== undefined;
    }

    getExtent(): GeometryExtent | undefined {
        return this.extent;
    }

    setExtent(extent: GeometryExtent): void {
        this.extent = extent;
    }

    clearFilter(): void {
        this.extent = undefined;
    }

    appendSearchParams(params: URLSearchParams): void {
        if (this.extent) {
            params.append(
                this.paramKey,
                `${this.extent.left},${this.extent.top},${this.extent.right},${this.extent.bottom}`
            );
        }
    }

    applyOfSearchParams(params: URLSearchParams): void {
        const matchedParam = params.get(this.paramKey);
        if (matchedParam) {
            const [left, top, right, bottom] = matchedParam.split(",");
            if (
                left !== undefined &&
                top !== undefined &&
                bottom !== undefined &&
                right !== undefined
            ) {
                try {
                    this.extent = {
                        top: parseFloat(top),
                        bottom: parseFloat(bottom),
                        left: parseFloat(left),
                        right: parseFloat(right)
                    };
                } catch (error) {
                    console.error(error);
                }
            }
        }
    }
}

export interface SearchFilter {
    searchTerm?: string;
    pageSize?: number;
    page?: number;
    order?: OrderOption;
    facets: Facet[];
}

export interface SearchService extends DeclaredService<"geonode-search.SearchService"> {
    searching: boolean;
    results: SearchResultEntry[] | undefined;
    resultCount: number;
    currentFilter: SearchFilter;
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
