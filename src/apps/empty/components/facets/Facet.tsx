// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import {
    Box,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionIcon,
    AccordionPanel
} from "@open-pioneer/chakra-integration";
import { Facet } from "catalog";
import { DateFacet } from "./DateFacet";
import { MultiSelectFacet } from "./MultiSelectFacet";

export function FacetComp(props: { facet: Facet }) {
    const { facet } = props;
    return (
        <Accordion allowToggle>
            <AccordionItem>
                {({ isExpanded }) => (
                    <>
                        <AccordionButton>
                            <Box as="span" flex="1" textAlign="left">
                                {facet.label}
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={3}>{getFacetContent(isExpanded)}</AccordionPanel>
                    </>
                )}
            </AccordionItem>
        </Accordion>
    );

    function getFacetContent(isExpanded: boolean) {
        switch (facet.type) {
            case "multiString":
                return <MultiSelectFacet facet={facet} isExpanded={isExpanded}></MultiSelectFacet>;
            case "date":
                return <DateFacet facet={facet}></DateFacet>;
            default:
                console.error("Could not find facet type");
                return <></>;
        }
    }
}
