function mangafireF() {
    let templateFuncs = {};

    templateFuncs.isChapterListPage = function() {
        return document.querySelector("div.list-body") !== null;
    };

    templateFuncs.getChapterElems = function(addRowsCallback) {
        // this is just a convenient place to do this
        let batchSpan = document.querySelector("button#md-batch-download-button").parentElement;
        batchSpan.style.position = "absolute";
        batchSpan.style.bottom = "100%";

        let removedList = false;
        const observer = new MutationObserver((records) => {
            let addList = null;
            for (record of records) {
                record.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE &&
                        node.classList.contains("scroll-sm")) {
                        addList = node.querySelectorAll("li.item > a,div.item > a");
                    }
                });
                record.removedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE &&
                        node.classList.contains("scroll-sm")) {
                        removedList = true;
                    }
                });
            }
            if (addList) {
                // this logic achieves the following: reset the list on first
                // tab change, just add on the one after that
                addRowsCallback(addList, !removedList);
            }
        });
        document.querySelectorAll("div.list-body").forEach((elem) => {
            observer.observe(elem, { childList: true });
        });

        return document.querySelectorAll("li.item > a,div.item > a");
    };

    templateFuncs.insertNote = function(note) {
        let chapterDiv = document.querySelector("section.m-list");
        chapterDiv.parentElement.insertBefore(note, chapterDiv);
    };

    templateFuncs.processChapterElem = function(elem, pdfButton, zipButton) {
        pdfButton.classList.add("md-download-button");
        zipButton.classList.add("md-download-button");

        let link = elem.href;
        let title = elem.querySelector("span").textContent.trim().replace(/:$/, "");

        elem.parentElement.appendChild(pdfButton);
        elem.parentElement.appendChild(zipButton);

        return [link, title];
    };

    let pageListUrlCache = {};

    function getImageListUrl(chapterUrl) {
        return new Promise((resolve, reject) => {
            if (chapterUrl in pageListUrlCache) {
                return pageListUrlCache[chapterUrl];
            }

            let tid = setTimeout(() => {
                document.body.removeChild(iframe);
                window.removeEventListener("message", handleMessage);
                reject("Timeout out determining image list URL");
            }, 30000);

            let iframeUrl = new URL(chapterUrl, window.location);
            iframeUrl.hash = "#7d093b4b-ad4c-4790-b0bf-3063fd4c8f67:" + window.location.origin;

            let iframe = document.createElement("iframe");
            iframe.src = iframeUrl.href;
            iframe.style.display = "none";

            function handleMessage(event) {
                if (event.origin != iframeUrl.origin) {
                    return;
                }

                if (event.source !== iframe.contentWindow) {
                    return;
                }

                if (event.data.ident != "7d093b4b-ad4c-4790-b0bf-3063fd4c8f67") {
                    return;
                }

                if (event.data.cmd == "done") {
                    clearTimeout(tid);
                    document.body.removeChild(iframe);
                    window.removeEventListener("message", handleMessage);
                    let url = event.data.result;
                    pageListUrlCache[chapterUrl] = url;
                    resolve(url);
                    return;
                }

                console.log("unhandled cmd:", event.data.cmd);
            }

            window.addEventListener("message", handleMessage);

            document.body.appendChild(iframe);
        });
    }

    templateFuncs.getChapterImageUrls = function(chapterUrl, buttonGroup, reportProgress) {
        reportProgress(0);
        return getImageListUrl(chapterUrl).then((url) => {
            reportProgress(0.5);
            return fetchText(url, chapterUrl).then((text) => {
                let data = JSON.parse(text);
                let chapImgs = [];
                for (const image of data.result.images) {
                    if (image[2] === 0) {
                        chapImgs.push(image[0]);
                    }
                }
                if (chapImgs || !data.result.images) {
                    return chapImgs;
                }
                throw "Scrambled images not supported";
            });
        });
    };

    templateF(templateFuncs);
}
