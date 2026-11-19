import { PluginSettingTab, type SettingDefinitionAction, type SettingDefinitionItem } from "obsidian";
import type WrapWithShortcut from "./main";
import type { WrapperTag } from "./main";
import WrapperCreatorModal from "./WrapperCreatorModal";

export default class SettingsTab extends PluginSettingTab {
	plugin: WrapWithShortcut;

	constructor(plugin: WrapWithShortcut) {
		super(plugin.app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		const wrappers = this.plugin.settings.wrapperTags;
		return [
			{
				type: "list",
				emptyState: "No wrapper yet.",
				addItem: {
					name: "Add wrapper",
					action: () => this.openEditor(),
				},
				search: wrappers.length > 0
					? {
						placeholder: "Filter wrappers…",
						match: (def, query) => def.name.toLowerCase().includes(query.toLowerCase()),
					}
					: undefined,
				onReorder: (oldIndex, newIndex) => {
					const [moved] = wrappers.splice(oldIndex, 1);
					wrappers.splice(newIndex, 0, moved);
					void this.plugin.saveSettings();
				},
				onDelete: (index) => {
					const [removed] = wrappers.splice(index, 1);
					this.plugin.unregisterWrapperCommand(removed);
					void this.plugin.saveSettings();
					this.update();
				},
				items: wrappers.map((wrapper, index): SettingDefinitionAction => ({
					name: wrapper.name,
					desc: `${wrapper.startTag}{selection}${wrapper.endTag}`,
					searchable: false,
					action: () => this.openEditor(index),
				})),
			},
		];
	}

	private openEditor(index?: number): void {
		const wrappers = this.plugin.settings.wrapperTags;
		const existing = index === undefined ? undefined : wrappers[index];
		new WrapperCreatorModal(this.app, async (result: WrapperTag) => {
			if (existing) {
				this.plugin.unregisterWrapperCommand(existing);
				wrappers[index!] = result;
			} else {
				wrappers.push(result);
			}
			this.plugin.registerWrapperCommand(result);
			await this.plugin.saveSettings();
			this.update();
		}, existing).open();
	}
}
