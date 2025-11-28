// content.js
(async () => {
  try {
    const url = chrome.runtime.getURL("message-worker.js");
    const res = await fetch(url);
    const code = await res.text();

    // JSON-encode the code so it's a valid string for an attribute
    const encoded = JSON.stringify(code);

    // Store on <html> so page JS can read it later
    document.documentElement.setAttribute("data-custom-worker", encoded);
  } catch (e) {
    console.error("[extension] failed to inject worker code", e);
  }
})();
