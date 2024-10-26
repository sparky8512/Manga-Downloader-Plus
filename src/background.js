function handleFetchError(url, err, sendResponse) {
    const origin = new URL(url).origin + "/";
    browser.permissions.contains({origins: [origin]}).then((res) => {
        if (res) {
            // not a permission problem
            sendResponse([false, "PERMISSION_OK"]);
        } else {
            sendResponse([false, "PERMISSION_FAILURE"]);
            browser.storage.session.set({lastFailHost: new URL(url).hostname});
        }
    }).catch((pcerr) => {
        console.log("permission check error: "+pcerr);
        // unexpected, so just send original error
        sendResponse([false, err]);
    });
}

function fetchCmd(url, ref, isImage, sendResponse) {
    let requestOpts = {referrer: ref, referrerPolicy: "no-referrer-when-downgrade", credentials: "include"};
    fetch(url, requestOpts).then((res) => {
        if (!res.ok) {
            sendResponse([false, res.status+" "+res.statusText]);
        } else {
            let body = isImage ? res.arrayBuffer() : res.text();
            body.then((content) => {
                sendResponse([true, content]);
            }, (err) => {
                sendResponse([false, err]);
            });
        }
    }).catch((err) => {
        handleFetchError(url, err, sendResponse);
    });

    return true;
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request["cmd"] == "fetchText") {
        return fetchCmd(request["url"], request["referrer"], false, sendResponse);
    }
    if (request["cmd"] == "fetchImage") {
        return fetchCmd(request["url"], request["referrer"], true, sendResponse);
    }

    console.log("unhandled cmd: "+request["cmd"]);
    return false;
});

browser.action.onClicked.addListener(() => {
    browser.runtime.openOptionsPage();
});
