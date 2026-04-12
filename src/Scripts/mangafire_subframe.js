(function() {
    if (!window.location.hash.startsWith("#7d093b4b-ad4c-4790-b0bf-3063fd4c8f67:http")) {
        return;
    }

    const parentOrigin = window.location.hash.substring(38);

    let done = false;

    XMLHttpRequest.prototype.origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
        if (new URL(url, window.location).pathname.match(/^\/ajax\/read\/(chapter|volume)\//)) {
            const message = {
                ident: "7d093b4b-ad4c-4790-b0bf-3063fd4c8f67",
                cmd: "done",
                result: url
            };
            window.parent.postMessage(message, parentOrigin);
            window.stop();
            done = true;
        }
        if (done) {
            throw Error();
        }
        return this.origOpen(method, url, ...args);
    };
}());
