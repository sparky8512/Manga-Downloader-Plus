// WARNING: this will get reset every time service worker goes inactive
let ruleIds = new Set();

function fetchCmd(url, ref, isImage, sendResponse) {
    let id = ruleIds.values().reduce((a, b) => Math.max(a, b), 0) + 1;
    ruleIds.add(id);

    function addReferrerRule(id, url, ref) {
        return chrome.declarativeNetRequest.updateSessionRules({addRules: [
            {
                id: id,
                priority: 1,
                action: {
                    type: "modifyHeaders",
                    requestHeaders: [ {header: "Referer", operation: "set", value: ref} ]
                },
                condition: {
                    initiatorDomains: [ chrome.runtime.id ],
                    urlFilter: url,
                    resourceTypes: [ "xmlhttprequest" ]
                }
            }
        ]});
    }
    addReferrerRule(id, url, ref).catch((err) => {
        // remove rule possibly leaked by suspended service worker and retry
        return chrome.declarativeNetRequest.updateSessionRules({removeRuleIds: [ id ]}).then(() => {
            return addReferrerRule(id, url, ref);
        });
    }).then(() => {
        fetch(url, {credentials: "include"}).then((res) => {
            if (!res.ok) {
                throw "status "+res.status;
            } else {
                let body = isImage ? res.arrayBuffer() : res.text();
                body.then((content) => {
                    if (isImage) {
                        content = Array.from(new Uint8Array(content));
                    }
                    sendResponse([true, content]);
                }, (err) => {
                    sendResponse([false, err]);
                });
            }
        }).catch((err) => {
            sendResponse([false, err]);
        }).finally(() => {
            chrome.declarativeNetRequest.updateSessionRules({removeRuleIds: [ id ]}).then(() => {
                // ok to reuse id now
                ruleIds.delete(id);
            }, (err) => {
                // failure here is unexpected, so do not reuse the id
                console.log("rule remove err: "+err);
            });
        });
    }, (err) => {
        // unexpected failure while retrying add rule, do not reuse id
        console.log("rule retry err: "+err);
        sendResponse([false, err]);
    });

    return true;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request["cmd"] == "fetchText") {
        return fetchCmd(request["url"], request["referrer"], false, sendResponse);
    }
    if (request["cmd"] == "fetchImage") {
        return fetchCmd(request["url"], request["referrer"], true, sendResponse);
    }

    console.log("unhandled cmd: "+request["cmd"]);
    return false;
});

chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});
