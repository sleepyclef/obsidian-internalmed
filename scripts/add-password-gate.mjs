// Injects a simple client-side numeric password gate into every built HTML
// page. This is NOT real security (the code is visible in the page source
// to anyone who looks) — it's a casual speed bump to keep the site out of
// search engines and away from people just browsing around, not a defense
// against a determined visitor.
import { readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const CODE = "0505"
const PUBLIC_DIR = path.join(process.cwd(), "public")

const GATE_SCRIPT = `<script>(function(){
var CODE=${JSON.stringify(CODE)};
var KEY="site-unlocked";
if (sessionStorage.getItem(KEY) === "1") return;
document.documentElement.style.visibility = "hidden";
document.addEventListener("DOMContentLoaded", function(){
  var overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;z-index:999999;font-family:system-ui,sans-serif;";
  overlay.innerHTML = '<form style="display:flex;flex-direction:column;gap:12px;align-items:center;"><label style="font-size:1.1rem;">Enter code</label><input type="password" inputmode="numeric" pattern="[0-9]*" autofocus style="font-size:1.5rem;text-align:center;letter-spacing:0.3em;padding:8px;width:8em;border-radius:6px;border:1px solid #444;background:#111;color:#fff;"><button type="submit" style="padding:8px 20px;border-radius:6px;border:none;background:#6091e2;color:#fff;font-size:1rem;cursor:pointer;">Unlock</button><p class="gate-err" style="color:#e26060;min-height:1.2em;font-size:0.9rem;"></p></form>';
  document.body.innerHTML = "";
  document.body.appendChild(overlay);
  document.documentElement.style.visibility = "visible";
  var form = overlay.querySelector("form");
  var input = overlay.querySelector("input");
  var err = overlay.querySelector(".gate-err");
  form.addEventListener("submit", function(e){
    e.preventDefault();
    if (input.value === CODE) {
      sessionStorage.setItem(KEY, "1");
      location.reload();
    } else {
      err.textContent = "Incorrect code";
      input.value = "";
    }
  });
});
})();</script>`

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(full)))
    } else if (entry.name.endsWith(".html")) {
      files.push(full)
    }
  }
  return files
}

const files = await walk(PUBLIC_DIR)
let count = 0
for (const file of files) {
  const html = await readFile(file, "utf8")
  if (html.includes("site-unlocked")) continue // already gated
  const patched = html.replace("</head>", `${GATE_SCRIPT}</head>`)
  await writeFile(file, patched, "utf8")
  count++
}
console.log(`Added password gate to ${count} page(s).`)
