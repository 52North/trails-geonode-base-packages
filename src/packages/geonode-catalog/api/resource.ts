// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
export interface GeonodeResource {
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
