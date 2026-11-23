import type { Editor } from "obsidian";

/** Wraps the selection in the tags, or unwraps it if already wrapped. */
export function toggleWrap(editor: Editor, startTag: string, endTag: string): void {
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
		// Tags are around the selection
		editor.setSelection(toPos(fos - startTag.length), toPos(tos + endTag.length));
		editor.replaceSelection(selectedText);
		editor.setSelection(toPos(fos - startTag.length), toPos(tos - startTag.length));
	} else if (startText === startTag && endText === endTag) {
		// Tags are inside the selection
		editor.replaceSelection(getRange(fos + startTag.length, tos - endTag.length));
		editor.setSelection(toPos(fos), toPos(tos - (startTag.length + endTag.length)));
	} else {
		editor.replaceSelection(`${startTag}${selectedText}${endTag}`);
		editor.setSelection(toPos(fos + startTag.length), toPos(tos + startTag.length));
	}
}
