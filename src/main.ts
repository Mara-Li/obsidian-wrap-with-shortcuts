import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, type WrapperTag, type WrapWithSettings } from "./interface";
import { WrapWithModal } from "./modal_import";
import WrapWithSettingsTab from "./SettingsTab";
import { toggleWrap } from "./wrap";

/** Id of the original plugin (manic/obsidian-wrap-with-shortcuts) this fork replaces. */
const LEGACY_PLUGIN_ID = "obsidian-wrap-with-shortcuts";

export default class WrapWithShortcut extends Plugin {
	settings!: WrapWithSettings;
	private wrapSettingTab!: WrapWithSettingsTab;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.wrapSettingTab = new WrapWithSettingsTab(this);
		this.addSettingTab(this.wrapSettingTab);
		for (const wrapper of this.settings.wrapperTags) this.registerWrapperCommand(wrapper);
		if (!this.settings.migrated) {
			this.app.workspace.onLayoutReady(() => this.firstLoad());
		}
	}

	private firstLoad(): void {
		const olderPlugin = this.app.plugins.getPlugin(LEGACY_PLUGIN_ID);
		const olderSettings = olderPlugin?.settings as Partial<WrapWithSettings> | undefined;
		const known = new Set(this.settings.wrapperTags.map((w) => `${w.startTag}\0${w.endTag}`));
		const toImport = (olderSettings?.wrapperTags ?? []).filter(
			(w) => !known.has(`${w.startTag}\0${w.endTag}`),
		);

		if (toImport.length === 0) {
			void this.markMigrated();
			return;
		}
		new WrapWithModal(this.app, (accepted) => {
			if (accepted) this.importWrappers(toImport);
			void this.markMigrated();
		}).open();
	}

	private importWrappers(wrappers: WrapperTag[]): void {
		wrappers.forEach((w, index) => {
			const wrapper: WrapperTag = { ...w, id: `legacy-${index}` };
			this.settings.wrapperTags.push(wrapper);
			this.registerWrapperCommand(wrapper);
		});
		// The settings tab caches its definitions; refresh them with the imported wrappers
		this.wrapSettingTab.update();
	}

	private async markMigrated(): Promise<void> {
		this.settings.migrated = true;
		await this.saveSettings();
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

	migrateToId(settings: unknown) {
		const data = Object.assign({}, structuredClone(DEFAULT_SETTINGS), settings);
		let migrated = false;
		data.wrapperTags.forEach((wrapper, index) => {
			if (!wrapper.id) {
				wrapper.id = `${index}`;
				migrated = true;
			}
		});
		return { data, migrated };
	}

	async loadSettings(): Promise<void> {
		const data = (await this.loadData()) as Partial<WrapWithSettings> | null;
		const migration = this.migrateToId(data);
		this.settings = migration.data;
		if (migration.migrated) await this.saveSettings();
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
