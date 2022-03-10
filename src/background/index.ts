var active = true;

const allowedAContentTypes = ["application/pdf", "application/json"];

chrome.webRequest.onHeadersReceived.addListener(
  function (details: chrome.webRequest.WebResponseHeadersDetails) {
    let headers = details.responseHeaders;
    let resp = { responseHeaders: headers };

    if (!active || !headers) {
      return resp;
    }

    // Should we look at the Content-Disposition header?
    for (let header of headers) {
      if (header.name.toLowerCase() == "content-type") {
        const value = header.value;
        if (!value) {
          return resp;
        }

        if (
          value.startsWith("text/") ||
          value.startsWith("image/") ||
          allowedAContentTypes.includes(value)
        ) {
          break;
        }

        return resp;
      }
    }

    for (let i = 0; i < headers.length; i++) {
      if (headers[i].name.toLowerCase() == "content-disposition") {
        if (headers[i].value?.indexOf("attachment") == 0) {
          headers.splice(i, 1);
        }
        break;
      }
    }

    return { responseHeaders: headers };
  },
  {
    urls: ["<all_urls>"],
    types: ["main_frame", "sub_frame"],
  },
  ["blocking", "responseHeaders"]
);

function loadOptions(callback: () => void) {
  chrome.storage.local.get("activeStatus", function (data) {
    if (data.activeStatus === undefined) {
      // at first install
      data.activeStatus = true;
      saveOptions();
    }
    active = data.activeStatus;
    if (callback != null) {
      callback();
    }
  });
}

function saveOptions() {
  chrome.storage.local.set({ activeStatus: active });
}

function updateUI() {
  let str = active
    ? "Undisposition active, click to deactivate"
    : "Undisposition disabled, click to activate";
  chrome.browserAction.setTitle({ title: str });
  chrome.browserAction.setBadgeText({ text: active ? "⠀" : "⠀" });
  chrome.browserAction.setBadgeBackgroundColor({
    color: active ? "#5084ee" : "#e91e63",
  });
}

function toggleActive() {
  active = !active;
  saveOptions();
  updateUI();
}

loadOptions(updateUI);
chrome.browserAction.onClicked.addListener(toggleActive);
