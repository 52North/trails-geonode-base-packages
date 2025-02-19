// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useIntl, useService } from "open-pioneer:react-hooks";
import { FC, useEffect, useState } from "react";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { AuthService, LoginEffect, useAuthState } from "@open-pioneer/authentication";
import { Box, Button, Text } from "@open-pioneer/chakra-integration";
import { GeoNodeUserService, TokenInfoResponse, UserInfoResponse } from "geonode-user";

export const UserInfo: FC = () => {
    const intl = useIntl();
    const authService = useService<AuthService>("authentication.AuthService");
    const userService = useService<GeoNodeUserService>("geonode-user.UserService");
    const authState = useAuthState(authService);

    const [userInfo, setUserInfo] = useState<UserInfoResponse>();
    const [tokenInfo, setTokenInfo] = useState<TokenInfoResponse>();
    const [userLoggedIn, setUserLoggedIn] = useState(false);
    const [tokenIssuedAt, setTokenIssuedAt] = useState<Date>();
    const [tokenExpiresAt, setTokenExpiresAt] = useState<Date>();
    useEffect(() => {
        const isAuthenticated = authState.kind === "authenticated";
        setUserLoggedIn(isAuthenticated);
        authService.getSessionInfo().then((sessionInfo) => {
            const issuedAt = sessionInfo?.attributes?.issuedAt;
            const expiresAt = sessionInfo?.attributes?.expiresAt;
            setTokenExpiresAt(expiresAt as Date);
            setTokenIssuedAt(issuedAt as Date);
        });

        if (isAuthenticated) {
            // userService.getUserInfo().then((info) => {
            //     setUserInfo(info);
            // });
            userService.getTokenInfo().then((info) => {
                setTokenInfo(info);
            });
        } else {
            setUserLoggedIn(false);
            setUserInfo(undefined);
        }
    }, [authState]);

    const loginBehaviour = authService.getLoginBehavior() as LoginEffect;
    const doLogout = () => authService.logout();

    return !userLoggedIn ? (
        <Button onClick={loginBehaviour.login}>Login</Button>
    ) : (
        <TitledSection
            title={<SectionHeading size={"md"}>Restricted Content here:</SectionHeading>}
        >
            {/* <div>Preferred Username: {userInfo?.preferred_username}</div> */}
            {/* <div>E-Mail: {userInfo?.email}</div> */}
            {/* <div>Access Token: {userInfo?.access_token}</div> */}
            <div>Username: {tokenInfo?.username}</div>
            <div>E-Mail: {tokenInfo?.email}</div>
            <div>Token issued at: {tokenIssuedAt?.toUTCString() ?? "unknown"}</div>
            <div>Token expires at: {tokenExpiresAt?.toUTCString() ?? "unknown"}</div>
            <Box pt={5}>
                <Button onClick={doLogout}>Logout</Button>
            </Box>
        </TitledSection>
    );
};
