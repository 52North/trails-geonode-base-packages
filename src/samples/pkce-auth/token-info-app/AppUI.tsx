// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Text, Box } from "@open-pioneer/chakra-integration";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { Notifier } from "@open-pioneer/notifier";
import { UserInfo } from "./ui/UserInfo";

export function AppUI() {
    const intl = useIntl();

    return (
        <>
            <Notifier position="bottom-right" />
            <TitledSection
                title={
                    <Box role="region" textAlign="center" py={1}>
                        <SectionHeading size={"md"}>User Info</SectionHeading>
                        <Text pt={5}>Log in to see token details.</Text>
                    </Box>
                }
            >
                <UserInfo />
            </TitledSection>
        </>
    );
}
