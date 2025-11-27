
const LUMA_THRESHOLD = 128;

function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function scaleImage(image, ratio, outputType = 'image/png') {
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
function getColorLuma([r, g, b]) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

 async function getAverageColor(url) {
  // Only visit every 5 pixels
  const blockSize = 5;
  const black = [0, 0, 0];
  let data;
  let i = -4;
  const rgb = [0, 0, 0];
  let count = 0;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext && canvas.getContext('2d');
  if (!context) {
    return black;
  }

  const image = await preloadImage(url);
  const height = image.naturalHeight || image.offsetHeight || image.height;
  const width = image.naturalWidth || image.offsetWidth || image.width;
  canvas.height = height;
  canvas.width = width;

  context.drawImage(image, 0, 0);

  try {
    data = context.getImageData(0, 0, width, height);
  } catch (e) {
    return black;
  }

  const length = data.data.length;

  while ((i += blockSize * 4) < length) {
    if (data.data[i + 3] === 0) continue; // Ignore fully transparent pixels
    ++count;
    rgb[0] += data.data[i];
    rgb[1] += data.data[i + 1];
    rgb[2] += data.data[i + 2];
  }

  rgb[0] = Math.floor(rgb[0] / count);
  rgb[1] = Math.floor(rgb[1] / count);
  rgb[2] = Math.floor(rgb[2] / count);

  return rgb;
}

async function steppedScale(
  img, width, height, step = 0.5, outputType = 'image/png',
) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const oc = document.createElement('canvas');
  const octx = oc.getContext('2d');

  canvas.width = width;
  canvas.height = height;

  if (img.width * step > width) { // For performance avoid unnecessary drawing
    const mul = 1 / step;
    let cur = {
      width: Math.floor(img.width * step),
      height: Math.floor(img.height * step),
    };

    oc.width = cur.width;
    oc.height = cur.height;

    octx.drawImage(img, 0, 0, cur.width, cur.height);

    while (cur.width * step > width) {
      cur = {
        width: Math.floor(cur.width * step),
        height: Math.floor(cur.height * step),
      };
      octx.drawImage(oc, 0, 0, cur.width * mul, cur.height * mul, 0, 0, cur.width, cur.height);
    }

    ctx.drawImage(oc, 0, 0, cur.width, cur.height, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  const averageColor = await getAverageColor(img.src);
  const fillColor = getColorLuma(averageColor) < LUMA_THRESHOLD ? '#fff' : '#000';
  ctx.fillStyle = fillColor;
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => {
    canvas.toBlob(resolve, outputType);
  });
}


async function scale(
  img, width, height, outputType,
) {
  // Safari does not have built-in resize method with quality control
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await window.createImageBitmap(img,
        { resizeWidth: width, resizeHeight: height, resizeQuality: 'high' });
      if (bitmap.height !== height || bitmap.width !== width) {
        throw new Error('Image bitmap resize not supported!'); // FF93 added support for options, but not resize
      }
      const averageColor = await getAverageColor(img.src);
      const fillColor = getColorLuma(averageColor) < LUMA_THRESHOLD ? '#fff' : '#000';
      return await new Promise((res) => {
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx2D = canvas.getContext('2d');
        ctx2D.fillStyle = fillColor;
        ctx2D.fillRect(0, 0, canvas.width, canvas.height);
        const ctx = canvas.getContext('bitmaprenderer');
        if (ctx) {
          ctx.transferFromImageBitmap(bitmap);
        } else {
          ctx2D.drawImage(bitmap, 0, 0);
        }
        canvas.toBlob(res, outputType);
      });
    } catch (e) {
      // Fallback. Firefox below 93 does not recognize `createImageBitmap` with 2 parameters
      return steppedScale(img, width, height, undefined, outputType);
    }
  } else {
    return steppedScale(img, width, height, undefined, outputType);
  }
}


// helper: read image dimensions from a Blob URL
  async function getImageSizeFromBlobUrl(blobUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = blobUrl;
    });
  }

  window.sendSpoilerTempMessage = async function (blob, ttlSeconds = 60) {
    // convert Blob into File if needed
    const file = blob instanceof File ? blob : new File([blob], "spoiler.jpg", { type: blob.type || "image/png" });
    const blobUrl = URL.createObjectURL(file);

    // 1) get original image size
    const { width, height } = await getImageSizeFromBlobUrl(blobUrl);

    // 2) build compressedBlobUrl like buildAttachment() does
    //    (roughly equivalent to MAX_STANDARD_QUALITY_IMG_SIZE = 1280)
    const MAX_STANDARD_QUALITY_IMG_SIZE = 1280;
    const maxSide = Math.max(width, height);
    const ratioForQuick = maxSide > MAX_STANDARD_QUALITY_IMG_SIZE
      ? MAX_STANDARD_QUALITY_IMG_SIZE / maxSide
      : 1;

    // scaleImage(image, ratio, outputType) -> returns blob URL of new image
    const compressedBlobUrl = await scaleImage(file, ratioForQuick, 'image/jpeg');

    // 3) build tiny preview thumbnail (like MAX_THUMB_IMG_SIZE = 40)
    const MAX_THUMB_IMG_SIZE = 40;
    const ratioForThumb = maxSide > MAX_THUMB_IMG_SIZE
      ? MAX_THUMB_IMG_SIZE / maxSide
      : 1;
    const previewBlobUrl = await scaleImage(file, ratioForThumb, 'image/jpeg');


    const LAST_MESSAGE_ID = 431

    // 4) create attachment object in the same shape Telegram uses
    const attachment = {
      blob: file,
      audio: undefined,
      blobUrl,               // original full-sized file
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      quick: {               // original dimensions
        width,
        height,
      },
      previewBlobUrl,        // tiny thumbnail
      uniqueId: `${Date.now()}-${Math.random()}`,
      shouldSendInHighQuality: false,
      compressedBlobUrl: compressedBlobUrl,     // resized/compressed photo Telegram will likely upload
      shouldSendAsSpoiler: true,
      // ttlSeconds,
    };

    // === build args as in your captured template ===
    let args = structuredClone([{
      "messageList": {
        "chatId": "7765319772",
        "threadId": -1,
        "type": "thread",
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
            "isEditable": true,
          },
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
        "lastReadInboxMessageId": LAST_MESSAGE_ID,
        "unreadCount": 0,
        "unreadMentionsCount": 0,
        "isListed": true,
      },
      "lastMessageId": LAST_MESSAGE_ID,
      "isStoryReply": false,
      "wasDrafted": false,
    }]);

    // ⬅️ important: args is an array; attach on args[0], not args.attachment
    args[0].attachment = attachment;



    console.log("💣 sending TEMP SPOILER message with args:", args);



    window.__tgWorkers[0].postMessage({
      payloads: [{
        name: "sendMessage",
        type: "callMethod",
        args: args,
        messageId: "mig" + Math.random().toString(36).slice(2),
        withCallback: true,
      }],
    });
  };

async function sendSpoilerFromUrl(imageUrl, ttlSeconds = 60) {
  // fetch the image as a blob
  const response = await fetch(imageUrl, { mode: "cors" });
  const blob = await response.blob();

  // send it through your Telegram code
  await window.sendSpoilerTempMessage(blob, ttlSeconds);
}


(() => {

    const OrigWorker = window.Worker;
  window.__tgWorkers = [];

  window.Worker = function(...args) {
    const w = new OrigWorker(...args);
    window.__tgWorkers.push(w);

    const origPostMessage = w.postMessage;
    w.postMessage = function(message, ...rest) {
      console.log("→ to worker:", JSON.stringify(message, (key, value) =>
  value === undefined ? null : value
));
      return origPostMessage.call(this, message, ...rest);
    };

    return w;
  };

})()

  console.log("vrum vrum camaro passando!")