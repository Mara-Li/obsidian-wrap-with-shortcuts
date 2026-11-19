import { type Editor, Plugin } from "obsidian";
import SettingsTab from "./SettingsTab";

export interface WrapperTag {
	id: string;
	name: string;
	startTag: string;
	endTag: string;
}

interface WrapperTagSettings {
	wrapperTags: WrapperTag[];
}

const DEFAULT_SETTINGS: WrapperTagSettings = {
	wrapperTags: [
		{
			id: "underline",
			name: "Underline",
			startTag: "<u>",
			endTag: "</u>",
		},
	],
};

export default class WrapWithShortcut extends Plugin {
	settings!: WrapperTagSettings;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.settings.wrapperTags.forEach((wrapperTag) => this.registerWrapperCommand(wrapperTag));
		this.addSettingTab(new SettingsTab(this));
	}

	private commandId(wrapperTag: WrapperTag): string {
		return `wrap-with-shortcut-${wrapperTag.id}`;
	}

	registerWrapperCommand(wrapperTag: WrapperTag): void {
		this.addCommand({
			id: this.commandId(wrapperTag),
			name: `Toggle ${wrapperTag.name}`,
			editorCallback: (editor: Editor) => this.wrapSelectedTextIn(editor, wrapperTag.startTag, wrapperTag.endTag),
		});
	}

	unregisterWrapperCommand(wrapperTag: WrapperTag): void {
		this.removeCommand(this.commandId(wrapperTag));
	}

	wrapSelectedTextIn(editor: Editor, startTag: string, endTag: string): void {
		if (startTag === "" && endTag === "") return;

		const selectedText = editor.getSelection();
		const toPos = (offset: number) => editor.offsetToPos(offset);
		const getRange = (from: number, to: number): string => {
			try {
				return editor.getRange(toPos(from), toPos(to));
			} catch {
				return "";
			}
		};

		const fos = editor.posToOffset(editor.getCursor("from"));
		const tos = editor.posToOffset(editor.getCursor("to"));
		const len = selectedText.length;

		const beforeText = getRange(fos - startTag.length, tos - len);
		const afterText = getRange(fos + len, tos + endTag.length);
		const startText = getRange(fos, fos + startTag.length);
		const endText = getRange(tos - endTag.length, tos);

		if (beforeText === startTag && afterText === endTag) {
			// Unwrap: tags are around the selection
			editor.setSelection(toPos(fos - startTag.length), toPos(tos + endTag.length));
			editor.replaceSelection(selectedText);
			editor.setSelection(toPos(fos - startTag.length), toPos(tos - startTag.length));
		} else if (startText === startTag && endText === endTag) {
			// Unwrap: tags are inside the selection
			editor.replaceSelection(getRange(fos + startTag.length, tos - endTag.length));
			editor.setSelection(toPos(fos), toPos(tos - (startTag.length + endTag.length)));
		} else {
			editor.replaceSelection(`${startTag}${selectedText}${endTag}`);
			editor.setSelection(toPos(fos + startTag.length), toPos(tos + startTag.length));
		}
	}

	async loadSettings(): Promise<void> {
		const data = (await this.loadData()) as Partial<WrapperTagSettings> | null;
		this.settings = Object.assign({}, structuredClone(DEFAULT_SETTINGS), data);
		// Older versions stored wrappers without an id
		let migrated = false;
		this.settings.wrapperTags.forEach((wrapperTag, index) => {
			if (!wrapperTag.id) {
				wrapperTag.id = `${index}`;
				migrated = true;
			}
		});
		if (migrated) await this.saveSettings();
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
