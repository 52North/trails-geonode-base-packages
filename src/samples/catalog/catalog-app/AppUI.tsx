// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Notifier } from "@open-pioneer/notifier";
import { BrowserRouter, Route, Routes } from "react-router";
import { Center, Grid, GridItem } from "@open-pioneer/chakra-integration";
import { GeoResultView } from "./GeoResultView";
import { SearchView } from "./SearchView";

export function AppUI() {
    return (
        <BrowserRouter basename="/samples/catalog/">
            <Grid
                templateAreas={`"header" "main" "footer"`}
                gridTemplateRows={"50px 1fr 30px"}
                gridTemplateColumns={"1fr"}
                h="100%"
                gap="1"
            >
                <GridItem bg="orange.50" area={"header"}>
                    <Center height="100%" fontWeight="bold">
                        Catalog Search
                    </Center>
                </GridItem>
                <GridItem area={"main"} height="100%" overflow="hidden">
                    <Routes>
                        <Route path="" element={<SearchView></SearchView>} />
                        <Route path="georesult/:id" element={<GeoResultView></GeoResultView>} />
                    </Routes>
                </GridItem>
                <GridItem bg="blue.50" area={"footer"}>
                    <Center height="100%">Footer</Center>
                </GridItem>
            </Grid>
            <Notifier position="bottom" />
        </BrowserRouter>
    );
}
