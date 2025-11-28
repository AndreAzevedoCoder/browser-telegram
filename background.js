// Source - https://stackoverflow.com/a
// Posted by Hashbrown, modified by community. See post 'Timeline' for change history
// Retrieved 2025-11-27, License - CC BY-SA 4.0

caches.keys().then(function(names) {
    for (let name of names)
        caches.delete(name);
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeNetRequest.updateDynamicRules(
    {
      // Remove old rule with same id (if it exists)
      removeRuleIds: [1],
      addRules: [
        {
          id: 1,
          priority: 1,
          action: {
            type: "redirect",
            redirect: {
              // Path inside your extension
              extensionPath: "/message-worker.js"
            }
          },
          condition: {
            // Match the exact Telegram JS file URL
            regexFilter: "^https://web\\.telegram\\.org/a/2026.*\\.js$"
          }
        }
      ]
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error("Error adding DNR rule:", chrome.runtime.lastError);
      } else {
        console.log("Telegram JS override rule added");
      }
    }
  );
});
