// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import {
    Box,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionIcon,
    AccordionPanel,
    CircularProgress,
    Center,
    List
} from "@open-pioneer/chakra-integration";
import { Facet, FacetOption } from "catalog";
import { ReactNode, useEffect, useState } from "react";
import { SearchService } from "../search-service";
import { useService } from "open-pioneer:react-hooks";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { NotificationService } from "@open-pioneer/notifier";

export function FacetComp(props: { facet: Facet }) {
    const { facet } = props;
    return (
        <Accordion allowToggle>
            <AccordionItem>
                {({ isExpanded }) => (
                    <>
                        <AccordionButton>
                            <Box as="span" flex="1" textAlign="left">
                                {facet.label} {isExpanded ? "exp" : ""}
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={3}>
                            <FacetOptionList
                                facet={facet}
                                isExpanded={isExpanded}
                            ></FacetOptionList>
                        </AccordionPanel>
                    </>
                )}
            </AccordionItem>
        </Accordion>
    );
}

function FacetOptionList(props: { facet: Facet; isExpanded: boolean }) {
    const { facet, isExpanded } = props;
    const searchSrvc = useService<SearchService>("SearchService");
    const notificationSrvc = useService<NotificationService>("notifier.NotificationService");

    const [options, setOptions] = useState<FacetOption[]>([]);
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
        console.log(`${facet.key} is expanded and must reload`);
        setLoading(true);
        searchSrvc
            .getFacetOptions(facet)
            .then((res) => {
                setLoading(false);
                setOptions(res);
            })
            .catch((err) => {
                console.error(err);
                notificationSrvc.notify({
                    level: "error",
                    title: `No facet options for ${facet.label}`,
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
                    searchSrvc.toggleFacetOption(facet, option);
                }

                function isSelected() {
                    return searchSrvc.isFacetOptionSelected(facet, option);
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
