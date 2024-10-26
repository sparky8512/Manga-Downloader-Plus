if (typeof browser == "undefined") {
    globalThis.browser = chrome;
}

function updateActivePermissions() {
    browser.permissions.getAll().then((perms) => {
        const matchOrigins = new Set(browser.runtime.getManifest().content_scripts[0].matches);
        const origins = new Set(perms.origins).difference(matchOrigins);

        const tbody = document.getElementById("md-active-permissions");
        tbody.replaceChildren();
        for (const origin of origins) {
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
            td.setAttribute("class", "md-col-hostname");
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

document.getElementById("md-permission-form").addEventListener("submit", (event) => {
    const data = new FormData(event.target);
    const hostname = data.get("hostname");

    if (/^(\*|((\*\.|)[A-Za-z0-9][\-A-Za-z0-9]*(\.[A-Za-z0-9][\-A-Za-z0-9]*)*))$/.test(hostname)) {
        const origin = "https://"+ hostname + "/*";
        browser.permissions.request({origins: [origin]}).then((res) => {
            if (res) {
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

updateActivePermissions();
window.addEventListener("focus", (event) => {
    updateActivePermissions();
});
