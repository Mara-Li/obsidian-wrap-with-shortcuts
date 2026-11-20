import {
    PluginSettingTab,
    type SettingDefinitionItem,
    type SettingDefinitionPage,
} from "obsidian";
import type WrapWithShortcut from "./main";
import type { WrapperField, WrapperTag } from "./interface";

const FIELDS: readonly WrapperField[] = ["name", "startTag", "endTag"];

export default class WrapWithSettingsTab extends PluginSettingTab {
	plugin: WrapWithShortcut;

	constructor(plugin: WrapWithShortcut) {
		super(plugin.app, plugin);
		this.plugin = plugin;
		this.containerEl.addClass(this.plugin.manifest.id);
	}

	private get wrappers(): WrapperTag[] {
		return this.plugin.settings.wrapperTags;
	}

	// Control keys are `<wrapper id>.<field>`
	private parseKey(key: string): { wrapper: WrapperTag; field: WrapperField } | null {
		const sep = key.lastIndexOf(".");
		const field = key.slice(sep + 1) as WrapperField;
		const wrapper = this.wrappers.find((w) => w.id === key.slice(0, sep));
		return wrapper && FIELDS.includes(field) ? { wrapper, field } : null;
	}

	getControlValue(key: string): unknown {
		const parsed = this.parseKey(key);
		return parsed ? parsed.wrapper[parsed.field] : super.getControlValue(key);
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		const parsed = this.parseKey(key);
		if (!parsed) return super.setControlValue(key, value);
		const { wrapper, field } = parsed;
		wrapper[field] = field === "name" ? String(value).trim() : String(value);
		// Command name is fixed at registration, tags are read on each call
		if (field === "name") this.plugin.registerWrapperCommand(wrapper);
		await this.plugin.saveSettings();
		// Ids keep the open page stable while its name and preview refresh
		this.update();
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				type: "list",
				emptyState: "No wrapper yet.",
				addItem: {
					name: "Add wrapper",
					action: () => void this.addWrapper(),
				},
				search:
					this.wrappers.length > 0
						? {
								placeholder: "Filter wrappers…",
								match: (def, query) =>
									def.name.toLowerCase().includes(query.toLowerCase()),
							}
						: undefined,
				onReorder: (oldIndex, newIndex) => {
					const [moved] = this.wrappers.splice(oldIndex, 1);
					this.wrappers.splice(newIndex, 0, moved);
					void this.plugin.saveSettings();
				},
				// Page items get no delete/drag buttons from Obsidian, only the
				// Delete/Backspace and Alt+↑/↓ shortcuts on the focused row
				onDelete: (index) => void this.deleteWrapper(this.wrappers[index]),
				items: this.wrappers.map((wrapper) => this.wrapperPage(wrapper)),
			},
		];
	}

	// `id` (Obsidian 1.14) keeps the open page stable when it is renamed
	private wrapperPage(wrapper: WrapperTag): SettingDefinitionPage {
		return {
			type: "page",
			id: wrapper.id,
			name: wrapper.name,
			desc: `${wrapper.startTag}{selection}${wrapper.endTag}`,
			items: [
				{
					// Only groups accept `cls`; it is the hook for the page's CSS
					type: "group",
					cls: `${this.plugin.manifest.id} wrapper-page`,
					items: [
						{
							name: "Name",
							desc: "Used for the command name.",
							searchable: false,
							control: {
								type: "text",
								key: `${wrapper.id}.name`,
								validate: (value) => (value.trim() ? undefined : "Name is required."),
							},
						},
						{
							name: "Start tag",
							searchable: false,
							control: { type: "textarea", key: `${wrapper.id}.startTag`, rows: 3 },
						},
						{
							name: "End tag",
							searchable: false,
							control: { type: "textarea", key: `${wrapper.id}.endTag`, rows: 3 },
						},
					],
				},
				{
					type: "group",
					items: [
						{
							name: "Delete wrapper",
							desc: "Also removes its command.",
							searchable: false,
							render: (setting) => {
								setting.addButton((button) =>
									button
										.setButtonText("Delete")
										.setDestructive()
										.onClick(() => void this.deleteWrapper(wrapper, true)),
								);
							},
						},
					],
				},
			],
		} as SettingDefinitionPage;
	}

	private async deleteWrapper(wrapper: WrapperTag | undefined, closePage = false): Promise<void> {
		if (!wrapper) return;
		this.wrappers.remove(wrapper);
		this.plugin.unregisterWrapperCommand(wrapper);
		await this.plugin.saveSettings();
		this.update();
		// Internal API: go back to the list once the open page is gone
		if (closePage) (this as unknown as { setting: { closePage(): void } }).setting.closePage();
	}

	private async addWrapper(): Promise<void> {
		const wrapper: WrapperTag = {
			id: `w${Date.now()}`,
			name: "New wrapper",
			startTag: "",
			endTag: "",
		};
		this.wrappers.push(wrapper);
		this.plugin.registerWrapperCommand(wrapper);
		await this.plugin.saveSettings();
		this.update();
	}
}
