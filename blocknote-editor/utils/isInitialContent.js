import isEqual from "lodash/isEqual";
const initialEditorJsonContent = {
    "type": "doc",
    "content": [
        {
            "type": "paragraph",
            "attrs": {
                "textAlign": null,
                "indent": 0,
                "decorated": false,
                "data-text-color": "Default",
                "data-bg-color": "Default"
            }
        },
        {
            "type": "paragraph",
            "attrs": {
                "textAlign": null,
                "indent": 0,
                "decorated": false,
                "data-text-color": "Default",
                "data-bg-color": "Default"
            }
        },
        {
            "type": "paragraph",
            "attrs": {
                "textAlign": null,
                "indent": 0,
                "decorated": false,
                "data-text-color": "Default",
                "data-bg-color": "Default"
            }
        },
        {
            "type": "paragraph",
            "attrs": {
                "textAlign": null,
                "indent": 0,
                "decorated": false,
                "data-text-color": "Default",
                "data-bg-color": "Default"
            }
        },
        {
            "type": "paragraph",
            "attrs": {
                "textAlign": null,
                "indent": 0,
                "decorated": false,
                "data-text-color": "Default",
                "data-bg-color": "Default"
            }
        },
        {
            "type": "paragraph",
            "attrs": {
                "textAlign": null,
                "indent": 0,
                "decorated": false,
                "data-text-color": "Default",
                "data-bg-color": "Default"
            }
        }
    ]
}

export function isInitialContent(editorJsonContent) {
    if (Array.isArray(editorJsonContent?.content) && editorJsonContent?.content?.length > 0) {
        const modifiedEditorJsonContent = editorJsonContent?.content?.map((item) => {
            return {
                ...item,
                attrs: {
                    textAlign: item?.attrs?.textAlign,
                    indent: item?.attrs?.indent,
                    decorated: item?.attrs?.decorated,
                    ['data-text-color']: item?.attrs?.['data-text-color'],
                    ['data-bg-color']: item?.attrs?.['data-bg-color']
                }
            }
        }
        )
        const editorJsonContentWithoutId = {
            ...editorJsonContent,
            content: modifiedEditorJsonContent
        }
        return isEqual(editorJsonContentWithoutId , initialEditorJsonContent);
    }
    return false;
}

