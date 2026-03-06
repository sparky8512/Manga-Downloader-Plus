if (typeof browser == "undefined") {
    globalThis.browser = chrome;
}

function updateActivePermissions() {
    browser.permissions.getAll().then((perms) => {
        const manifest = browser.runtime.getManifest();
        let autoOrigins = new Set(manifest.content_scripts[0].matches);
        autoOrigins = autoOrigins.union(new Set(manifest.host_permissions));
        const currentOrigins = new Set(perms.origins);
        const missingOrigins = autoOrigins.difference(currentOrigins);
        const extraOrigins = currentOrigins.difference(autoOrigins);

        let missingElem = document.getElementById("md-missing-permissions");
        if (missingOrigins.size) {
            missingElem.origins = missingOrigins;
            missingElem.style.display = "flex";
        } else {
            missingElem.style.display = "none";
        }

        const tbody = document.getElementById("md-active-permissions");
        tbody.replaceChildren();
        for (const origin of extraOrigins) {
            const matches = origin.match(/^https:\/\/(.*)\/\*$/);
            if (matches === null) {
                continue;
            }

            const tr = document.createElement("tr");

            let td = document.createElement("td");
            td.setAttribute("class", "md-col-hostname");
            td.textContent = matches[1];
            tr.appendChild(td);

            td = document.createElement("td");
            td.setAttribute("class", "md-col-remove-button");
            const button = document.createElement("button");
            button.setAttribute("class", "md-remove-button");
            button.setAttribute("title", "Remove permission for this hostname");
            button.innerHTML = "&times;";
            button.addEventListener("click", removePermission);
            td.appendChild(button);
            tr.appendChild(td);

            tbody.appendChild(tr);
        }

        if (tbody.childElementCount === 0) {
            const tr = document.createElement("tr");
            let td = document.createElement("td");
            td.setAttribute("class", "md-col-hostname-empty");
            td.textContent = "none added";
            tr.appendChild(td);
            td = document.createElement("td");
            td.setAttribute("class", "md-col-remove-button");
            tr.appendChild(td);
            tbody.appendChild(tr);
        }
    }).catch((err) => {
        console.log("Get err: "+err);
    });
}

document.getElementById("md-request-missing").addEventListener("click", (event) => {
    const missingOrigins = document.getElementById("md-missing-permissions").origins;
    if (missingOrigins.size) {
        browser.permissions.request({origins: Array.from(missingOrigins)}).then((res) => {
            if (res) {
                updateActivePermissions();
            }
        }, (err) => {
            console.log("Request err: "+err);
        });
    }
});

document.getElementById("md-permission-form").addEventListener("submit", (event) => {
    const data = new FormData(event.target);
    const hostname = data.get("hostname");

    if (/^(\*|((\*\.|)[A-Za-z0-9][\-A-Za-z0-9]*(\.[A-Za-z0-9][\-A-Za-z0-9]*)*))$/.test(hostname)) {
        const origin = "https://"+ hostname + "/*";
        browser.permissions.request({origins: [origin]}).then((res) => {
            if (res) {
                if (lastFailHost === hostname) {
                    browser.storage.session.set({lastFailHost: null});
                }
                document.getElementById("md-hostname").value = "";
                updateActivePermissions();
            }
        }, (err) => {
            console.log("Request err: "+err);
        });
    }

    event.preventDefault();
});

function removePermission(event) {
    const hostname = event.target.parentElement.previousElementSibling.textContent;
    const origin = "https://"+ hostname + "/*";
    browser.permissions.remove({origins: [origin]}).then((res) => {
            if (res) {
                updateActivePermissions();
            }
        }, (err) => {
            console.log("Remove err: "+err);
        });

    event.preventDefault();
}

let lastFailHost = null;

function updateDefaultHostname() {
    const hostElem = document.getElementById("md-hostname");
    if (hostElem.value === "" && lastFailHost !== null) {
        hostElem.value = lastFailHost;
    }
}

browser.storage.session.onChanged.addListener((changes) => {
    if ("lastFailHost" in changes) {
        lastFailHost = changes.lastFailHost.newValue;
        updateDefaultHostname();
    }
});

browser.storage.session.get({lastFailHost: null}).then((res) => {
    lastFailHost = res.lastFailHost;
    updateDefaultHostname();
}).catch((err) => {
    console.log("Storage get err: "+err);
});

updateActivePermissions();
window.addEventListener("focus", (event) => {
    updateActivePermissions();
});

browser.runtime.sendMessage({cmd: "identify"}).then((res) => {
    if (res === "chrome" || res === "firefox") {
         document.getElementById("md-options").classList.add("md-"+res);
    }
}).catch((err) => {
    console.log("Browser id err: "+err);
});

function rateLimitElemChanged(event, attr) {
    let elem = event.target;
    if (elem.reportValidity()) {
        let params = getRateLimitParams();
        params[attr] = elem.value * 1000;
        setRateLimitParams(params);
    }
}

function setFromStorage() {
    let params = getRateLimitParams();
    document.getElementById("md-interval-fixed").value = params.min/1000;
    document.getElementById("md-interval-random").value = params.rand/1000;
}

function rateLimitReset(event) {
    setRateLimitParams(null).then(() => {
        setFromStorage();
    });
}

initOptions().then(() => {
    document.getElementById("md-interval-fixed").addEventListener("change",
        (e) => rateLimitElemChanged(e, "min"));
    document.getElementById("md-interval-random").addEventListener("change",
        (e) => rateLimitElemChanged(e, "rand"));
    document.getElementById("md-interval-reset").addEventListener("click",
        rateLimitReset);

    setFromStorage();
});

function toggleMoreInfo(event) {
    let infoElem = document.getElementById("md-hostname-info");
    if (infoElem.style.display == "none") {
        infoElem.style.display = "";
        event.target.textContent = "less info about hostnames";
    } else {
        infoElem.style.display = "none";
        event.target.textContent = "more info about hostnames";
    }
}

document.getElementById("md-more-info").addEventListener("click", toggleMoreInfo);
