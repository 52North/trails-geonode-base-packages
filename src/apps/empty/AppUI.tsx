// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { SearchView } from "./views/SearchView";
import { Notifier } from "@open-pioneer/notifier";
import { BrowserRouter, Route, Routes } from "react-router";
import { GeoResultView } from "./views/GeoResultView";

export function AppUI() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<SearchView></SearchView>} />
                <Route path="georesult/:id" element={<GeoResultView></GeoResultView>} />
            </Routes>
            <Notifier position="bottom" />
        </BrowserRouter>
    );
}
