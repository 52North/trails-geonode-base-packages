// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import {
    Card,
    CardBody,
    CardFooter,
    Heading,
    Stack,
    Image,
    Text,
    Box,
    Button
} from "@open-pioneer/chakra-integration";
import { useNavigate } from "react-router";
import { SearchResultEntry } from "../api";

export function ResultEntry(props: { resultEntry: SearchResultEntry }) {
    const { resultEntry } = props;
    const navigate = useNavigate();

    function getImage(): import("react").ReactNode {
        const imageSize = { base: "100%", sm: "400px" };
        if (resultEntry.imageUrl) {
            return (
                <Image
                    objectFit="contain"
                    maxW={imageSize}
                    src={resultEntry.imageUrl}
                    alt="Caffe Latte"
                />
            );
        } else {
            return <Box bgColor={"#f0f0f0"} width={imageSize}></Box>;
        }
    }

    function navToEntry(): void {
        const path = `georesult/${resultEntry.id}`;
        navigate(path);
    }

    return (
        <Card
            direction={{ base: "column", sm: "row" }}
            overflow="hidden"
            variant="outline"
            width={"100%"}
        >
            {getImage()}
            <Stack width="100%">
                <CardBody>
                    <Heading size="md">{resultEntry.title}</Heading>

                    <Text py="2">
                        {resultEntry.type} - {resultEntry.subType}
                    </Text>
                </CardBody>

                <CardFooter justify={"flex-end"} padding={0} alignItems={"center"}>
                    <Box>
                        {resultEntry.type === "dataset" && (
                            <Button variant="ghost" onClick={() => navToEntry()}>
                                View
                            </Button>
                        )}
                    </Box>
                </CardFooter>
            </Stack>
        </Card>
    );
}
