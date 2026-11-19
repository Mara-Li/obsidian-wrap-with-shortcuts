/* eslint-disable @typescript-eslint/no-unused-vars -- type params must match the original declarations */
// `SettingDefinitionItem#id` exists since Obsidian 1.14 but is missing from the typings
export {};

declare module "obsidian" {
	interface SettingDefinitionBase {
		id?: string;
	}
	interface SettingDefinitionGroup<K extends string = string> {
		id?: string;
	}
	interface SettingDefinitionPage<K extends string = string> {
		id?: string;
	}
}
/* eslint-enable @typescript-eslint/no-unused-vars -- end of augmentation */
