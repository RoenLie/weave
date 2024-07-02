interface DOMParser {
	parseFromString(string: string, type: DOMParserSupportedType, options: {
		includeShadowRoots: boolean;
	}): Document;
}
