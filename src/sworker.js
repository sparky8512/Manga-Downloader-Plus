// WARNING: this will get reset every time service worker goes inactive
let ruleIds = new Set();

function handleFetchError(url, err, sendResponse) {
    const origin = new URL(url).origin + "/";
    chrome.permissions.contains({origins: [origin]}).then((res) => {
        if (res) {
            // not a permission problem
            sendResponse([false, "PERMISSION_OK"]);
        } else {
            sendResponse([false, "PERMISSION_FAILURE"]);
            chrome.storage.session.set({lastFailHost: new URL(url).hostname});
        }
    }).catch((pcerr) => {
        console.log("permission check error: "+pcerr);
        // unexpected, so just send original error
        sendResponse([false, err]);
    });
}

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
            handleFetchError(url, err, sendResponse);
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
    if (request["cmd"] == "identify") {
        sendResponse("chrome");
        return true;
    }

    console.log("unhandled cmd: "+request["cmd"]);
    return false;
});

chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});
