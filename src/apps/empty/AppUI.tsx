// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { SearchView } from "./components/SearchView";
import { Notifier } from "@open-pioneer/notifier";

export function AppUI() {
    return (
        <>
            <SearchView></SearchView>
            <Notifier position="bottom" />
        </>
    );
}
