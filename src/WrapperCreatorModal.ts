import { type App, ButtonComponent, displayTooltip, Modal, Setting, TextComponent } from "obsidian";
import type { WrapperTag } from "./main";

export default class WrapperCreatorModal extends Modal {
	private wrapper: WrapperTag;
	private nameInput!: TextComponent;

	constructor(app: App, private onSubmit: (wrapper: WrapperTag) => void | Promise<void>, wrapper?: WrapperTag) {
		super(app);
		// Work on a copy so cancelling leaves the original untouched
		this.wrapper = wrapper
			? { ...wrapper }
			: { id: `w${Date.now()}`, name: "", startTag: "", endTag: "" };
		this.modalEl.addClass("mod-lg");
		this.setTitle(wrapper ? "Edit wrapper" : "Add wrapper");
	}

	onOpen(): void {
		const { contentEl: el } = this;
		el.empty();

		new Setting(el)
			.setName("Name")
			.setDesc("Used for the command name.")
			.addText((cb) => {
				this.nameInput = cb;
				cb.setValue(this.wrapper.name).onChange((value) => {
					this.wrapper.name = value.trim();
				});
			});

		new Setting(el)
			.setName("Start tag")
			.addTextArea((cb) => {
				cb.setValue(this.wrapper.startTag).onChange((value) => {
					this.wrapper.startTag = value;
				});
			});

		new Setting(el)
			.setName("End tag")
			.addTextArea((cb) => {
				cb.setValue(this.wrapper.endTag).onChange((value) => {
					this.wrapper.endTag = value;
				});
			});

		const buttonsEl = el.createDiv({ cls: "modal-button-container" });
		new ButtonComponent(buttonsEl)
			.setButtonText("Save")
			.setCta()
			.onClick(() => void this.submit());
		new ButtonComponent(buttonsEl)
			.setButtonText("Cancel")
			.onClick(() => this.close());

		this.nameInput.inputEl.focus();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private async submit(): Promise<void> {
		if (!this.wrapper.name) {
			displayTooltip(this.nameInput.inputEl, "Required", { classes: ["mod-error"] });
			return;
		}
		if (!this.wrapper.startTag && !this.wrapper.endTag) {
			displayTooltip(this.nameInput.inputEl, "At least one tag is required", { classes: ["mod-error"] });
			return;
		}
		await this.onSubmit(this.wrapper);
		this.close();
	}
}
