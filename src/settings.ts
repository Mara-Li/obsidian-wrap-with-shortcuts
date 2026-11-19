export interface WrapperTag {
	id: string;
	name: string;
	startTag: string;
	endTag: string;
}

export type WrapperField = Exclude<keyof WrapperTag, "id">;

export interface WrapperTagSettings {
	wrapperTags: WrapperTag[];
}

export const DEFAULT_SETTINGS: WrapperTagSettings = {
	wrapperTags: [
		{
			id: "underline",
			name: "Underline",
			startTag: "<u>",
			endTag: "</u>",
		},
	],
};
