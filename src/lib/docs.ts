export type DocSectionId =
		| 'installationHeader'
		| 'usageHeader'
		| 'api-reference'
	| 'practicalApplicationHeader';

export interface DocSection {
	id: DocSectionId;
	label: string;
}

export const docsSections = [
	{ id: 'installationHeader', label: 'Installation' },
	{ id: 'usageHeader', label: 'Usage' },
	{ id: 'api-reference', label: 'API' },
	{ id: 'practicalApplicationHeader', label: 'Examples' }
] as const satisfies readonly DocSection[];
