// Obsidian's editor shows notes exactly as typed, but Markdown throws away
// leading tabs/spaces (or turns them into code blocks) and collapses any run of
// blank lines into one paragraph break. This rewrites the raw note text before
// it is parsed so the site keeps that spacing:
//   - ordinary text lines with leading tabs/spaces are wrapped in an indented
//     <span class="ws-indent">, so long lines wrap with a hanging indent
//     (styled in quartz/styles/custom.scss)
//   - every blank line beyond the first becomes an extra <br>
// Real nested list items ("\t- foo" under another list item) are left alone so
// they still render as nested lists. An indented "- foo" under an ordinary line
// isn't a list item to Markdown (it would lose its indent), so it's wrapped too.

const TAB_WIDTH = 4

const FENCE = /^[ \t]*(`{3,}|~{3,})/
const MATH_FENCE = /^[ \t]*\$\$[ \t]*$/
const LIST_ITEM = /^([ \t]*)([-*+]|\d{1,9}[.)])([ \t]+)\S/
// Other lines whose indentation carries Markdown meaning we want to keep
const STRUCTURAL = /^[ \t]*([>|]|<[a-zA-Z/!])/

function indentWidth(indent) {
  let width = 0
  for (const ch of indent) width += ch === "\t" ? TAB_WIDTH : 1
  return width
}

export function preserveWhitespace(src) {
  const lines = src.split(/\r?\n/)
  const out = []
  let i = 0

  // Leave YAML frontmatter untouched
  if (lines[0] === "---") {
    const end = lines.indexOf("---", 1)
    if (end !== -1) {
      out.push(...lines.slice(0, end + 1))
      i = end + 1
    }
  }

  let fence = null // closing marker while inside ``` / ~~~ / $$ blocks
  let blankRun = 0
  let seenText = false
  // content column of the latest real list item, or -1 when not in a list
  let listContentCol = -1

  for (; i < lines.length; i++) {
    const line = lines[i]

    if (fence) {
      out.push(line)
      if (fence === "$$" ? MATH_FENCE.test(line) : line.trim().startsWith(fence)) fence = null
      continue
    }

    if (line.trim() === "") {
      blankRun++
      continue
    }

    const afterBlank = blankRun > 0
    if (blankRun > 0) {
      out.push("")
      if (blankRun > 1 && seenText) {
        for (let n = 1; n < blankRun; n++) out.push("<br>")
        out.push("")
      }
      blankRun = 0
    }
    seenText = true

    const fenceMatch = line.match(FENCE)
    if (fenceMatch) {
      fence = fenceMatch[1]
      out.push(line)
      continue
    }
    if (MATH_FENCE.test(line)) {
      fence = "$$"
      out.push(line)
      continue
    }

    const indent = line.match(/^[ \t]*/)[0]
    const width = indentWidth(indent)
    const item = line.match(LIST_ITEM)

    // A marker line only starts a list item if it's near the left margin or
    // nested within reach of the previous item's content (CommonMark allows
    // up to 3 columns of slack).
    if (item && (width <= 3 || (listContentCol >= 0 && width <= listContentCol + 3))) {
      listContentCol = width + indentWidth(item[2] + item[3])
      out.push(line)
      continue
    }

    if (!indent || STRUCTURAL.test(line)) {
      // unindented text after a blank line ends any open list; without the blank
      // line it just continues the current item's paragraph
      if (afterBlank) listContentCol = -1
      out.push(line)
      continue
    }

    // Wrapped lines sit at column 0, so after a blank line they end the list too
    if (afterBlank) listContentCol = -1
    out.push(
      `<span class="ws-indent" style="--ws-indent: ${width}">${line.slice(indent.length)}</span>`,
    )
  }

  return out.join("\n") + "\n"
}

export const PreserveWhitespace = () => ({
  name: "PreserveWhitespace",
  textTransform(_ctx, src) {
    return preserveWhitespace(src)
  },
})

export default PreserveWhitespace

export const manifest = {
  name: "preserve-whitespace",
  displayName: "Preserve Whitespace",
  description: "Keep Obsidian-style leading indentation and extra blank lines visible",
  version: "1.0.0",
  category: "transformer",
}
