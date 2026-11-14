type FeaturedSummaryLayoutInput = {
	sections: string[];
	canFeatureSummary: boolean;
};

export const shouldFeatureSummary = (showHeader: boolean, main: readonly string[]) =>
	showHeader && main[0] === "summary";

type FeaturedSummaryLayout = {
	featuredSummarySection: "summary" | undefined;
	regularSections: string[];
};

export const getFeaturedSummaryLayout = ({
	sections,
	canFeatureSummary,
}: FeaturedSummaryLayoutInput): FeaturedSummaryLayout => {
	const featuredSummarySection = canFeatureSummary && sections.includes("summary") ? "summary" : undefined;

	return {
		featuredSummarySection,
		regularSections: featuredSummarySection ? sections.filter((section) => section !== "summary") : sections,
	};
};
