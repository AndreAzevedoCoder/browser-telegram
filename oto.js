
// In your content script
const iframe = document.createElement('iframe');
iframe.src = chrome.runtime.getURL('sandbox.html');
iframe.style.display = 'none'; // Hide the iframe
document.body.appendChild(iframe);