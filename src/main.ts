import { Plugin } from "obsidian";
import SettingsTab from "./SettingsTab";
import { DEFAULT_SETTINGS, type WrapperTag, type WrapperTagSettings } from "./settings";
import { toggleWrap } from "./wrap";

export default class WrapWithShortcut extends Plugin {
	settings!: WrapperTagSettings;

	async onload(): Promise<void> {
		await this.loadSettings();
		for (const wrapper of this.settings.wrapperTags) this.registerWrapperCommand(wrapper);
		this.addSettingTab(new SettingsTab(this));
	}

	private commandId(wrapper: WrapperTag): string {
		return `wrap-with-shortcut-${wrapper.id}`;
	}

	registerWrapperCommand(wrapper: WrapperTag): void {
		this.addCommand({
			id: this.commandId(wrapper),
			name: `Toggle ${wrapper.name}`,
			editorCallback: (editor) => toggleWrap(editor, wrapper.startTag, wrapper.endTag),
		});
	}

	unregisterWrapperCommand(wrapper: WrapperTag): void {
		this.removeCommand(this.commandId(wrapper));
	}

	async loadSettings(): Promise<void> {
		const data = (await this.loadData()) as Partial<WrapperTagSettings> | null;
		this.settings = Object.assign({}, structuredClone(DEFAULT_SETTINGS), data);
		// Older versions stored wrappers without an id
		let migrated = false;
		this.settings.wrapperTags.forEach((wrapper, index) => {
			if (!wrapper.id) {
				wrapper.id = `${index}`;
				migrated = true;
			}
		});
		if (migrated) await this.saveSettings();
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
