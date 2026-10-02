// Makes the site's file explorer follow the custom order set with the Obsidian
// "Drag and Drop Sort" plugin. That plugin saves its order per vault in
// .obsidian/plugins/drag-drop-sort/data.json as { orders: { "<folder path>":
// [child names...] } }, with "/" for the vault root.
//
// The order is read from each vault folder inside content/ when it's there
// (local builds), otherwise from explorer-order.json at the repo root, which
// `npx quartz sync` refreshes (the deploy build never sees .obsidian).
//
// Items you've placed come first in your order, then any unplaced folders A–Z,
// then unplaced files A–Z — the same rule the Obsidian plugin uses. The
// explorer's sortFn in quartz.config.yaml calls window.__explorerSort.
import fs from "node:fs"
import path from "node:path"

export const SNAPSHOT_FILE = "explorer-order.json"
const PLUGIN_DATA = path.join(".obsidian", "plugins", "drag-drop-sort", "data.json")

// { "<vault folder relative to content>": orders } for every vault in contentDir
export function readVaultOrders(contentDir) {
  const result = {}
  let entries = []
  try {
    entries = fs.readdirSync(contentDir, { withFileTypes: true })
  } catch {
    return result
  }
  for (const entry of entries) {
    const dataFile = path.join(contentDir, entry.name, PLUGIN_DATA)
    try {
      const orders = JSON.parse(fs.readFileSync(dataFile, "utf8")).orders
      if (orders) result[entry.name] = orders
    } catch {}
  }
  return result
}

function loadOrders(contentDir) {
  let orders = {}
  try {
    orders = JSON.parse(fs.readFileSync(path.join(process.cwd(), SNAPSHOT_FILE), "utf8"))
  } catch {}
  return { ...orders, ...readVaultOrders(contentDir) }
}

// Runs in the browser; `a` and `b` are sibling explorer nodes.
function explorerSort(a, b) {
  var orders = window.__explorerOrder || {}

  // Folder pages Quartz generates carry a made-up slugified path
  // ("internal-med/cardiology/index.md"), so prefer a real note's path
  function realPath(node) {
    var d = node.data
    if (d && d.filePath && d.filePath !== d.slug + ".md") return d.filePath
    for (var i = 0; i < node.children.length; i++) {
      var p = realPath(node.children[i])
      if (p) return p
    }
    return null
  }

  // Original name and parent folder path, taken from the real file path of the
  // node or one of its descendants
  function info(node) {
    var filePath = realPath(node) || (node.data && node.data.filePath)
    if (!filePath) return null
    var segs = filePath.split("/").slice(0, node.slugSegments.length)
    return { name: segs[segs.length - 1], parent: segs.slice(0, -1).join("/") }
  }

  function rank(i) {
    if (!i) return -1
    for (var vault in orders) {
      if (i.parent !== vault && i.parent.indexOf(vault + "/") !== 0) continue
      var list = orders[vault][i.parent === vault ? "/" : i.parent.slice(vault.length + 1)]
      return list ? list.indexOf(i.name) : -1
    }
    return -1
  }

  var ia = info(a)
  var ib = info(b)
  var ra = rank(ia)
  var rb = rank(ib)
  if (ra >= 0 && rb >= 0) return ra - rb
  if (ra >= 0) return -1
  if (rb >= 0) return 1
  if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
  var na = ia ? ia.name : a.displayName || ""
  var nb = ib ? ib.name : b.displayName || ""
  return na.localeCompare(nb, undefined, { numeric: true, sensitivity: "base" })
}

export const ExplorerOrder = () => ({
  name: "ExplorerOrder",
  // Quartz only loads transformers that define one of these; this plugin just
  // ships a client-side script, so it adds no HTML transforms.
  htmlPlugins() {
    return []
  },
  externalResources(ctx) {
    const orders = loadOrders(path.resolve(ctx.argv.directory))
    return {
      js: [
        {
          script: `window.__explorerOrder=${JSON.stringify(orders)};window.__explorerSort=${explorerSort.toString()};`,
          loadTime: "beforeDOMReady",
          contentType: "inline",
        },
      ],
    }
  },
})

export default ExplorerOrder

export const manifest = {
  name: "explorer-order",
  displayName: "Explorer Order",
  description: "Order the file explorer like the Obsidian Drag and Drop Sort plugin",
  version: "1.0.0",
  category: "transformer",
}
