function mangakakalotF() {
    let templateFuncs = {};

    templateFuncs.isChapterListPage = function() {
        return document.querySelector("div.manga-info-chapter") !== null;
    };

    templateFuncs.waitChaptersLoaded = function() {
        return new Promise((resolve, reject) => {
            const loadingElem = document.querySelector("p.chapter-loading-text");
            if (loadingElem === null) {
                resolve(true);
                return;
            }

            let tid = setTimeout(function() {
                observer.disconnect();
                resolve(false);
            }, 60000);

            const observer = new MutationObserver((records) => {
                for (record of records) {
                    if (Array.from(record.removedNodes).includes(loadingElem)) {
                        clearTimeout(tid);
                        observer.disconnect();
                        resolve(true);
                        break;
                    }
                }
            });
            observer.observe(loadingElem.parentNode, { childList: true });
        });
    };


    templateFuncs.getChapterElems = function(addRowsCallback) {
        // this is just a convenient place to do this
        let batchNote = document.querySelector("span#md-batch-note");
        batchNote.style.color = "#000000";

        let chapterList = document.querySelector("div.chapter-list");
        let rows = chapterList.querySelectorAll("div.row");
        const observer = new MutationObserver((records) => {
            let newRows = [];
            for (record of records) {
                record.addedNodes.forEach((elem) => {
                    if (elem.matches("div.row")) {
                        newRows.push(elem);
                    }
                });
            }
            if (newRows) {
                addRowsCallback(newRows);
            }
        });
        observer.observe(chapterList, { childList: true });
        return rows;
    };

    templateFuncs.insertNote = function(note) {
        let chapterDiv = document.querySelector("div.manga-info-chapter").parentNode;
        chapterDiv.insertBefore(note,chapterDiv.firstChild);
    };

    templateFuncs.processChapterElem = function(elem, pdfButton, zipButton) {
        // highlight row when hover
        elem.classList.add("md-mangakakalot-highlight");

        // store chapter link
        let link = elem.querySelector("a").href;
        let title = elem.querySelector("a").textContent;

        let buttonHolder = document.createElement("div");
        buttonHolder.style.cssText = "text-align: right;width: 100%; color: #667";
        buttonHolder.appendChild(pdfButton);
        buttonHolder.appendChild(zipButton);

        elem.appendChild(buttonHolder);

        return [link, title];
    };

    templateFuncs.getChapterImageUrls = function(chapterUrl, buttonGroup, reportProgress) {
        return fetchText(chapterUrl, window.location.href).then((text) => {
            // convert text to html DOM
            let parser = new DOMParser();
            let doc = parser.parseFromString(text, "text/html");
            let imgs = doc.querySelectorAll("div.container-chapter-reader img");

            let chapImgs = [];
            for (let img of imgs) {
                chapImgs.push(img.src);
            }

            return chapImgs;
        });
    };

    templateF(templateFuncs);
}
