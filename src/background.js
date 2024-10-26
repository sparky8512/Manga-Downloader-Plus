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
    }, (err) => {
        sendResponse([false, err]);
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
