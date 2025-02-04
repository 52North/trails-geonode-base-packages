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
import { DateFacetComp } from "./DateFacet";
import { MultiSelectFacet } from "./MultiSelectFacet";
import { DateFacet, Facet, GeometryExtentFacet, MultiSelectionFacet } from "catalog";
import { GeometryExtentFacetComp } from "./GeometryExtentFacet";

export function FacetList(props: { facets: Facet[] }) {
    const { facets } = props;
    return facets.map((f) => <FacetComp key={f.key} facet={f}></FacetComp>);
}

function FacetComp(props: { facet: Facet }) {
    const { facet } = props;

    return (
        <Accordion allowToggle>
            <AccordionItem>
                {({ isExpanded }) => (
                    <>
                        <AccordionButton>
                            <Box
                                as="span"
                                flex="1"
                                textAlign="left"
                                fontWeight={facet.hasActiveFilter() ? "bold" : "normal"}
                            >
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
        if (facet instanceof DateFacet) {
            return <DateFacetComp dateFacet={facet} />;
        }
        if (facet instanceof MultiSelectionFacet) {
            return <MultiSelectFacet multiSelectionFacet={facet} isExpanded={isExpanded} />;
        }
        if (facet instanceof GeometryExtentFacet) {
            return <GeometryExtentFacetComp facet={facet} isExpanded={isExpanded} />;
        }
        console.error("Could not find facet type");
        return <></>;
    }
}
