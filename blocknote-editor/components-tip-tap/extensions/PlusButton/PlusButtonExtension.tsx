import { Extension } from "@tiptap/core";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Plugin } from 'prosemirror-state'

// Styles
import "./plus-button.less";

const PlusButtonExtension = Extension.create({
    name: "plusButton",
    addOptions() {
        return {
            getEditor: () => null,
        }
    },
    addProseMirrorPlugins() {
        const plugins = this.parent?.() || [];
        return [
            ...plugins,
            new Plugin({
                props: {
                    decorations: ({ doc, selection }) => {
                        const decorations: Decoration[] = [];

                        doc.descendants((node, pos) => {
                            if (node.type.name === "paragraph") {
                                const deco = Decoration.widget(pos, () => {
                                    const button = document.createElement("div");
                                    button.className = "plus-button";
                                    button.innerText = "+";

                                    button.addEventListener("click", e => {
                                        e.stopPropagation();

                                        // Fetching editor via getter
                                        const editor = this.options.getEditor();
                                        if (!editor) return;

                                        // Check if "/" already exists
                                        let { from } = editor.state.selection;
                                        if (from > 0) from -= 1; // Out of bounds

                                        const textBefore = editor.state.doc.textBetween(from, from + 1, " ");
                                        if (textBefore === "/") {
                                            console.log("Slash already exists, preventing duplicate insertion");
                                            return;
                                        }

                                        const tr = editor.state.tr.insertText("/", selection.from);
                                        editor.view.dispatch(tr);
                                        editor.commands.focus();
                                        // editor.commands.insertContent("/"); // On click, trigger Slash constructor
                                    });

                                    return button;
                                });

                                decorations.push(deco);
                            }
                        });

                        return DecorationSet.create(doc, decorations);
                    },
                },
             })
        ];
    },
});

export default PlusButtonExtension;