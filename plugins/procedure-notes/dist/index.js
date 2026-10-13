import { pathToRoot } from "@quartz-community/utils"

// Keep the embed in the website build so the linked Obsidian vault needs no edits.
export const ProcedureNotes = () => ({
  name: "ProcedureNotes",
  htmlPlugins() {
    return [
      () => (tree, file) => {
        if (file.data.slug !== "internal-med/resources/procedure-notes") return
        const src = `${pathToRoot(file.data.slug)}/static/tools/procedure-note-builder.html`
        tree.children.push({
          type: "element",
          tagName: "section",
          properties: { className: ["procedure-builder"], ariaLabel: "Procedure note builder" },
          children: [
            {
              type: "element",
              tagName: "p",
              properties: {},
              children: [
                {
                  type: "element",
                  tagName: "a",
                  properties: {
                    href: src,
                    target: "_blank",
                    rel: "noopener",
                    dataRouterIgnore: true,
                    dataNoPopover: true,
                  },
                  children: [{ type: "text", value: "Open builder in a full tab ↗" }],
                },
              ],
            },
            {
              type: "element",
              tagName: "iframe",
              properties: {
                src,
                title:
                  "Procedure note builder — paracentesis, thoracentesis, US-guided PIV, and arterial line",
                className: ["procedure-builder-frame"],
                allow: "clipboard-write",
              },
              children: [],
            },
          ],
        })
      },
    ]
  },
})

export default ProcedureNotes

export const manifest = {
  name: "procedure-notes",
  displayName: "Procedure Notes",
  description: "Embed the procedure note builder in Resources → Procedure Notes",
  version: "1.0.0",
  category: "transformer",
}
