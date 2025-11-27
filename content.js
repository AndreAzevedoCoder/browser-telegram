console.log("sfadao")

const s = document.createElement('script');
s.src = chrome.runtime.getURL('inject.js');
(document.head || document.documentElement).appendChild(s);
s.remove();

// const worker = new Worker(chrome.runtime.getURL("message-worker.js"));
// console.log(worker)

// In your content script
// const workerUrl = chrome.runtime.getURL('message-worker.js');
// const worker = new Worker(workerUrl);

