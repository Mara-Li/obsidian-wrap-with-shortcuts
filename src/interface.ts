export interface WrapperTag {
	id: string;
	name: string;
	startTag: string;
	endTag: string;
}

export type WrapperField = Exclude<keyof WrapperTag, "id">;

export interface WrapWithSettings {
	migrated?: boolean;
	wrapperTags: WrapperTag[];
}

export const DEFAULT_SETTINGS: WrapWithSettings = {
	migrated: false,
	wrapperTags: [
		{
			id: "underline",
			name: "Underline",
			startTag: "<u>",
			endTag: "</u>",
		},
	],
};
