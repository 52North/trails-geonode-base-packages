// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { DeclaredService } from "@open-pioneer/runtime";

export interface TokenInfoResponse {
    client_id: string;
    user_id: number;
    username: string;
    issued_to: string;
    access_token: string;
    email: string;
    verified_email: string;
    access_type: string;
    expires_in: number;
}

export interface UserInfoResponse {
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    email: string;
    preferred_username: string;
    groups: string[];
    access_token: string;
}

export interface GeoNodeUserService extends DeclaredService<"geonode-user.UserService"> {
    getUserInfo(): Promise<UserInfoResponse>;
    getTokenInfo(): Promise<TokenInfoResponse>;
}
