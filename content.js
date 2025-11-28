
const s = document.createElement('script');
s.src = chrome.runtime.getURL('inject.js');
(document.head || document.documentElement).appendChild(s);
s.remove();




// content.js (in addition to your worker code injection stuff)

// Remove existing <meta http-equiv="Content-Security-Policy">
function removeMetaCSP() {
  const metas = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
  metas.forEach((m) => m.remove());
}

removeMetaCSP();

// Watch for new ones being added dynamically
const observer = new MutationObserver((mutations) => {
  for (const mut of mutations) {
    for (const node of mut.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = /** @type {HTMLElement} */ (node);

      if (
        el.tagName === "META" &&
        el.getAttribute("http-equiv") === "Content-Security-Policy"
      ) {
        el.remove();
        continue;
      }

      const inner = el.querySelectorAll?.(
        'meta[http-equiv="Content-Security-Policy"]',
      );
      inner?.forEach((m) => m.remove());
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });
