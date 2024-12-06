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
    Box
} from "@open-pioneer/chakra-integration";
import { SearchResultEntry } from "catalog";

export function ResultEntry(props: { resultEntry: SearchResultEntry }) {
    const { resultEntry } = props;

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

    return (
        <Card
            direction={{ base: "column", sm: "row" }}
            overflow="hidden"
            variant="outline"
            width={"100%"}
        >
            {getImage()}
            <Stack>
                <CardBody>
                    <Heading size="md">{resultEntry.title}</Heading>

                    <Text py="2">{/* {resultEntry.imageUrl} */}</Text>
                </CardBody>

                <CardFooter>
                    {/* <Button variant="solid" colorScheme="blue">
                        Buy Latte
                    </Button> */}
                </CardFooter>
            </Stack>
        </Card>
    );
}
