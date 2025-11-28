chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeNetRequest.updateDynamicRules(
    {
      removeRuleIds: [1, 2],
      addRules: [
        // 1️⃣ Redirect main.*.js to your modified version
        {
          id: 1,
          priority: 1,
          action: {
            type: "redirect",
            redirect: {
              extensionPath: "/modified-main.js",
            },
          },
          condition: {
            regexFilter: "^https://web\\.telegram\\.org/a/main.*\\.js$",
          },
        },

        // 2️⃣ Override CSP on the main document so blob workers are allowed
        // {
        //   id: 2,
        //   priority: 2,
        //   action: {
        //     type: "modifyHeaders",
        //     responseHeaders: [
        //       {
        //         header: "content-security-policy",
        //         operation: "set",
        //         value: [
        //           // allow basic stuff + data/blob
        //           "default-src 'self' https://web.telegram.org https://telegram.org data: blob:",
        //           // IMPORTANT: allow blob: for scripts (fallback for workers)
        //           "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://web.telegram.org https://telegram.org",
        //           // IMPORTANT: explicitly allow blob: workers
        //           "worker-src 'self' blob:",
        //           // pretty loose, but ok for your personal hack
        //           "connect-src *",
        //           "img-src * data: blob:",
        //           "style-src 'self' 'unsafe-inline' https://web.telegram.org https://telegram.org",
        //         ].join("; "),
        //       },
        //     ],
        //   },
        //   condition: {
        //     urlFilter: "https://web.telegram.org/a/",
        //     resourceTypes: ["main_frame"],
        //   },
        // },
        {
          "id": 2,
          "priority": 1,
          "action": {
            "type": "modifyHeaders",
            "responseHeaders": [
              {
                "header": "content-security-policy",
                "operation": "remove"
              }
            ]
          },
          "condition": {
            "urlFilter": "*",
            "resourceTypes": ["main_frame", "sub_frame"]
          }
        }
      ],
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error("Error adding DNR rule:", chrome.runtime.lastError);
      } else {
        console.log("Telegram JS override & CSP rule added");
      }
    },
  );
});
