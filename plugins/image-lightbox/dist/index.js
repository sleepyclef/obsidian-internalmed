// Click any image inside a note to open it enlarged in a full-screen overlay.
// Click anywhere or press Escape to close. Images that are already links are
// left alone so the link still works. Uses one delegated click listener on the
// document, so it keeps working across Quartz's SPA navigation.

const SCRIPT = `(function(){
if (window.__imageLightbox) return;
window.__imageLightbox = true;

var overlay = null;
function close() {
  if (!overlay) return;
  overlay.remove();
  overlay = null;
  document.documentElement.style.overflow = "";
}
function open(src, alt) {
  close();
  overlay = document.createElement("div");
  overlay.className = "image-lightbox";
  var img = document.createElement("img");
  img.src = src;
  img.alt = alt || "";
  overlay.appendChild(img);
  overlay.addEventListener("click", close);
  document.body.appendChild(overlay);
  document.documentElement.style.overflow = "hidden";
}

document.addEventListener("click", function(e) {
  var img = e.target.closest && e.target.closest("article img");
  if (!img || img.closest("a, .popover, .image-lightbox")) return;
  e.preventDefault();
  open(img.currentSrc || img.src, img.alt);
});
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") close();
});
document.addEventListener("nav", close);
})();`

const CSS = `
article img:not(a img) { cursor: zoom-in; }
.image-lightbox {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2vmin;
  background: rgba(0, 0, 0, 0.85);
  cursor: zoom-out;
  animation: image-lightbox-in 0.15s ease-out;
}
.image-lightbox img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
  background: var(--light);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
}
@keyframes image-lightbox-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
`

export const ImageLightbox = () => ({
  name: "ImageLightbox",
  // Quartz only loads transformers that define one of these; this plugin just
  // ships client-side resources, so it adds no HTML transforms.
  htmlPlugins() {
    return []
  },
  externalResources() {
    return {
      css: [{ content: CSS, inline: true }],
      js: [{ script: SCRIPT, loadTime: "afterDOMReady", contentType: "inline" }],
    }
  },
})

export default ImageLightbox

export const manifest = {
  name: "image-lightbox",
  displayName: "Image Lightbox",
  description: "Click an image in a note to view it enlarged",
  version: "1.0.0",
  category: "transformer",
}
