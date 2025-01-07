// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { MultiSelectionFacetOption, MultiSelectionFacet } from "catalog";
import { useService } from "open-pioneer:react-hooks";
import { NotificationService } from "@open-pioneer/notifier";
import { ReactNode, useEffect, useState } from "react";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { Box, Center, CircularProgress, List } from "@open-pioneer/chakra-integration";
import { SearchService } from "../../services/search-service";

export function MultiSelectFacet(props: {
    multiSelectionFacet: MultiSelectionFacet;
    isExpanded: boolean;
}) {
    const { multiSelectionFacet, isExpanded } = props;
    const searchSrvc = useService<SearchService>("SearchService");
    const notificationSrvc = useService<NotificationService>("notifier.NotificationService");

    const [options, setOptions] = useState<MultiSelectionFacetOption[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (isExpanded) {
            loadingOptions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isExpanded]);

    const reloadNeccessary = useReactiveSnapshot(
        () => isExpanded && searchSrvc.searching,
        [searchSrvc.searching, isExpanded]
    );

    useEffect(() => {
        if (reloadNeccessary) {
            loadingOptions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadNeccessary]);

    function loadingOptions() {
        console.log(`${multiSelectionFacet.key} is expanded and must reload`);
        setLoading(true);
        multiSelectionFacet
            .loadFacetOptions(searchSrvc.currentFilter)
            .then((res) => {
                setLoading(false);
                setOptions(res);
            })
            .catch((err) => {
                console.error(err);
                notificationSrvc.notify({
                    level: "error",
                    title: `No facet options for ${multiSelectionFacet.label}`,
                    message: "Error while requesting facet options"
                });
                setOptions([]);
                setLoading(false);
            });
    }

    function Loading() {
        if (loading) {
            return (
                <Center>
                    <CircularProgress size="20px" isIndeterminate color="blue.600" />
                </Center>
            );
        }
    }

    function getFacetOptions(): ReactNode {
        if (!loading && options.length) {
            return options.map((option) => {
                function toggleFacetOption(): void {
                    multiSelectionFacet.toggleOption(option);
                    searchSrvc.startSearch();
                }

                function isSelected() {
                    return multiSelectionFacet.isOptionSelected(option);
                }

                return (
                    <Box
                        key={option.key}
                        _hover={{ cursor: "pointer" }}
                        onClick={toggleFacetOption}
                        fontWeight={isSelected() ? "bold" : "normal"}
                    >
                        {option.label}
                        {option.count && <span> ({option.count})</span>}
                    </Box>
                );
            });
        } else {
            return <></>;
        }
    }

    return (
        <>
            {Loading()}
            <List spacing={1}>{getFacetOptions()}</List>
        </>
    );
}
