function mangabuddyF() {
    let templateFuncs = {};

    templateFuncs.isChapterListPage = function() {
        return document.querySelector("div#chapter-list-inner") !== null;
    };

    templateFuncs.getChapterElems = function(addRowsCallback) {
        let chapterList = document.querySelector("div#chapter-list-inner");
        let rows = chapterList.querySelectorAll("ul#chapter-list > li > a");
        const observer = new MutationObserver((records) => {
            let newRows = null;
            for (record of records) {
                record.addedNodes.forEach((elem) => {
                    if (elem.matches("ul#chapter-list")) {
                        newRows = elem.querySelectorAll("li > a");
                    }
                });
            }
            if (newRows !== null) {
                addRowsCallback(newRows, true);
            }
        });
        observer.observe(chapterList, { childList: true });
        return rows;
    };

    templateFuncs.insertNote = function(note) {
        let chapterDiv = document.querySelector("div#chapter-list-inner");
        chapterDiv.parentElement.insertBefore(note, chapterDiv);
    };

    templateFuncs.processChapterElem = function(elem, pdfButton, zipButton) {
        pdfButton.classList.add("md-download-button");
        zipButton.classList.add("md-download-button");

        let link = elem.href;
        let title = elem.querySelector(".chapter-title").textContent;

        elem.parentElement.appendChild(pdfButton, elem);
        elem.parentElement.appendChild(zipButton, elem);

        return [link, title];
    };

    templateFuncs.getChapterImageUrls = function(chapterUrl, buttonGroup, reportProgress) {
        return fetchText(chapterUrl, window.location.href).then((text) => {
            // convert text to html DOM
            let parser = new DOMParser();
            let doc = parser.parseFromString(text, "text/html");
            let scripts = doc.querySelectorAll("script");
            for (let script of scripts) {
                let parts = script.innerText.match(/var\s+chapImages\s*=\s*'(.*)'/);
                if (parts !== null) {
                    return parts[1].split(",");
                }
            }
            throw "Image list not found";
        });
    };

    templateF(templateFuncs);
}
