export function scaleImage(image, ratio, outputType = 'image/png') {
  const url = image instanceof Blob ? URL.createObjectURL(image) : image;
  const img = new Image();
  return new Promise((resolve) => {
    img.onload = () => {
      scale(img, img.width * ratio, img.height * ratio, outputType)
        .then((blob) => {
          if (!blob) throw new Error('Image resize failed!');
          return URL.createObjectURL(blob);
        })
        .then(resolve)
        .finally(() => {
          if (image instanceof Blob) {
            URL.revokeObjectURL(url); // Revoke blob url that we created
          }
        });
    };
    img.src = url;
  });
}


(() => {
  const OrigWorker = window.Worker;
  window.__tgWorkers = [];

  window.Worker = function(...args) {
    const w = new OrigWorker(...args);
    window.__tgWorkers.push(w);

    const origPostMessage = w.postMessage;
    w.postMessage = function(message, ...rest) {
      console.log("→ to worker:", message);
      return origPostMessage.call(this, message, ...rest);
    };

    return w;
  };


  window.sendSpoilerTempMessage = async function (blob, ttlSeconds = 60) {

    // convert Blob into File if needed
    const file = blob instanceof File ? blob : new File([blob], "spoiler.png", { type: blob.type });
    let blobUrl = URL.createObjectURL(file);

    // create attachment object
    const attachment = {
      blob: file,
      blobUrl: blobUrl,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      "quick": {
            "width": 1206,
            "height": 1600
        },
        "previewBlobUrl": blobUrl,
        uniqueId: `${Date.now()}-${Math.random()}`,
        "shouldSendInHighQuality": false,
      shouldSendAsSpoiler: true,
      ttlSeconds,
    };
    // {
    //     "blob": blob,
    //     "blobUrl": "blob:https://web.telegram.org/e1f8c515-106e-4ee3-bfe0-ddac396a8edc",
    //     "filename": "$.png",
    //     "mimeType": "image/png",
    //     "size": 2397052,
    //     "quick": {
    //         "width": 1206,
    //         "height": 1600
    //     },
    //     "previewBlobUrl": "blob:https://web.telegram.org/b0e85a78-2fe5-4791-a1dd-fa63ba3935ab",
    //     "uniqueId": "1764174097949-0.17012357661939836",
    //     "shouldSendInHighQuality": false,
    //     "compressedBlobUrl": "blob:https://web.telegram.org/e1f8c515-106e-4ee3-bfe0-ddac396a8edc",
    //     "shouldSendAsSpoiler": true,
    //     "ttlSeconds": 5
    // }

    // create new args
    const args = structuredClone(
            [{
        "messageList": {
            "chatId": "7765319772",
            "threadId": -1,
            "type": "thread"
        },
        "text": "",
        "isSilent": false,
        "shouldUpdateStickerSetOrder": true,
        "shouldGroupMessages": true,
        "chat": {
            "id": "7765319772",
            "type": "chatTypePrivate",
            "title": "André",
            "isMin": false,
            "usernames": [
                {
                    "username": "ozym1888",
                    "isActive": true,
                    "isEditable": true
                }
            ],
            "accessHash": "-7127778048549655621",
            "isVerified": false,
            "isCallActive": false,
            "isCallNotEmpty": false,
            "hasUsername": true,
            "isProtected": false,
            "isCreator": false,
            "isForum": false,
            "isBotForum": false,
            "areStoriesHidden": false,
            "hasStories": false,
            "lastReadOutboxMessageId": 0,
            "lastReadInboxMessageId": 419,
            "unreadCount": 0,
            "unreadMentionsCount": 0,
            "isListed": true
        },
        "lastMessageId": 419,
        "isStoryReply": false,
        // "attachment": {
        //     "blob": blob,
        //     "blobUrl": "blob:https://web.telegram.org/e1f8c515-106e-4ee3-bfe0-ddac396a8edc",
        //     "filename": "$.png",
        //     "mimeType": "image/png",
        //     "size": 2397052,
        //     "quick": {
        //         "width": 1206,
        //         "height": 1600
        //     },
        //     "previewBlobUrl": "blob:https://web.telegram.org/b0e85a78-2fe5-4791-a1dd-fa63ba3935ab",
        //     "uniqueId": "1764174097949-0.17012357661939836",
        //     "shouldSendInHighQuality": false,
        //     "compressedBlobUrl": "blob:https://web.telegram.org/e1f8c515-106e-4ee3-bfe0-ddac396a8edc",
        //     "shouldSendAsSpoiler": true,
        //     "ttlSeconds": 5
        // },
        "wasDrafted": false
    }
]
    );
    args.attachment = attachment;

    console.log("💣 sending TEMP SPOILER message with args:", args);

    // final send
    window.__tgWorkers[0].postMessage({
      payloads: [{
        name: "sendMessage",
        type: "callMethod",
        args: [args],
        messageId: "ext_" + Math.random(),
        withCallback: true
      }]
    });
  };
})();






// window.__tgWorkers[0].postMessage({
//   payloads: [{
//      name: "sendMessage",
//      type: "callMethod",
//      args: 



//      [{
//         "messageList": {
//             "chatId": "7765319772",
//             "threadId": -1,
//             "type": "thread"
//         },
//         "text": "",
//         "isSilent": false,
//         "shouldUpdateStickerSetOrder": true,
//         "shouldGroupMessages": true,
//         "chat": {
//             "id": "7765319772",
//             "type": "chatTypePrivate",
//             "title": "André",
//             "isMin": false,
//             "usernames": [
//                 {
//                     "username": "ozym1888",
//                     "isActive": true,
//                     "isEditable": true
//                 }
//             ],
//             "accessHash": "-7127778048549655621",
//             "isVerified": false,
//             "isCallActive": false,
//             "isCallNotEmpty": false,
//             "hasUsername": true,
//             "isProtected": false,
//             "isCreator": false,
//             "isForum": false,
//             "isBotForum": false,
//             "areStoriesHidden": false,
//             "hasStories": false,
//             "lastReadOutboxMessageId": 0,
//             "lastReadInboxMessageId": 419,
//             "unreadCount": 0,
//             "unreadMentionsCount": 0,
//             "isListed": true
//         },
//         "lastMessageId": 419,
//         "isStoryReply": false,
//         "attachment": {
//             "blob": {},
//             "blobUrl": "blob:https://web.telegram.org/e1f8c515-106e-4ee3-bfe0-ddac396a8edc",
//             "filename": "$.png",
//             "mimeType": "image/png",
//             "size": 2397052,
//             "quick": {
//                 "width": 1206,
//                 "height": 1600
//             },
//             "previewBlobUrl": "blob:https://web.telegram.org/b0e85a78-2fe5-4791-a1dd-fa63ba3935ab",
//             "uniqueId": "1764174097949-0.17012357661939836",
//             "shouldSendInHighQuality": false,
//             "compressedBlobUrl": "blob:https://web.telegram.org/e1f8c515-106e-4ee3-bfe0-ddac396a8edc",
//             "shouldSendAsSpoiler": true,
//             "ttlSeconds": 5
//         },
//         "wasDrafted": false
//     }
// ],
//      messageId: "ext_" + Math.random(),
//      withCallback: true
//   }]
// });



// ability to trigger sending a temp spoiler message
  

console.log("🔥 inject.js 3 loaded!");

