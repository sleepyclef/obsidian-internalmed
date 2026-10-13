import { h } from "preact"
import { classNames, resolveRelative, slugifyFilePath } from "@quartz-community/utils"

export function QuickLinks({ title = "Quick links", links = [] } = {}) {
  const targets = links.map(({ label, path }) => ({ label, slug: slugifyFilePath(path) }))

  const Component = ({ fileData, allFiles, displayClass }) => {
    // Only show shortcuts to published notes, so removed or private pages don't break links.
    const published = new Set(allFiles.map((file) => file.slug))
    const available = targets.filter((link) => published.has(link.slug))
    if (available.length === 0) return null

    return h(
      "nav",
      { class: classNames("quick-links", displayClass), "aria-label": title },
      h("h3", null, title),
      h(
        "ul",
        null,
        available.map(({ label, slug }) =>
          h(
            "li",
            { key: slug },
            h(
              "a",
              {
                class: "internal",
                href: resolveRelative(fileData.slug, slug),
                "aria-current": fileData.slug === slug ? "page" : undefined,
              },
              label,
            ),
          ),
        ),
      ),
    )
  }

  Component.displayName = "QuickLinks"
  Component.css = `
    .quick-links > h3 {
      font-size: 1rem;
      margin: 0;
    }
    .quick-links > ul {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      list-style: none;
      padding: 0;
      margin: 0.75rem 0 0;
    }
    .quick-links a {
      display: block;
      line-height: 1.4;
      background-color: transparent;
    }
    .quick-links a[aria-current="page"] {
      color: var(--dark);
      font-weight: 600;
    }
  `
  return Component
}
