import { type App, Modal, Setting } from "obsidian";

export class WrapWithModal extends Modal {
	private result = false;

	constructor(
		app: App,
		private readonly onSubmit: (result: boolean) => void,
	) {
		super(app);

		this.setTitle("Import old settings?");
		this.setContent(
			"The original Wrap with shortcuts plugin was detected in your configuration. Do you want to import its wrappers?",
		);

		new Setting(this.contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Import")
					.setCta()
					.onClick(() => {
						this.result = true;
						this.close();
					}),
			)
			.addButton((btn) => btn.setButtonText("Skip").onClick(() => this.close()));
	}

	/** Always called, even when the modal is dismissed with Escape or a click outside. */
	onClose(): void {
		this.contentEl.empty();
		this.onSubmit(this.result);
	}
}
