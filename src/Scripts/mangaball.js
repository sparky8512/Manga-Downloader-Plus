function mangaballF() {
    let templateFuncs = {};

    templateFuncs.isChapterListPage = function() {
        return document.querySelector("div#chaptersContainer") !== null;
    };

    templateFuncs.waitChaptersLoaded = function() {
        return new Promise((resolve, reject) => {
            let loops = 0;
            function loop() {
                if (document.querySelector("div#chaptersContainer > div.volume-chapters") !== null) {
                    resolve(true);
                } else if (loops++ < 60) {
                    setTimeout(loop, 500);
                } else {
                    resolve(false);
                }
            }
            loop();
        });
    };

    templateFuncs.getChapterElems = function(addRowsCallback) {
        let chapterList = document.querySelector("div#chaptersContainer");
        let rows = chapterList.querySelectorAll("div.chapter-translation");
        const observer = new MutationObserver((records) => {
            let newRows = null;
            for (record of records) {
                record.addedNodes.forEach((elem) => {
                    if (elem.matches("div.volume-chapters")) {
                        newRows = elem.querySelectorAll("div.chapter-translation");
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
        let chapterDiv = document.querySelector("div#chaptersContainer");
        chapterDiv.parentElement.insertBefore(note, chapterDiv);
    };

    templateFuncs.processChapterElem = function(elem, pdfButton, zipButton) {
        pdfButton.classList.add("md-download-button");
        zipButton.classList.add("md-download-button");

        let link = elem.querySelector("ul.dropdown-menu > li:nth-child(1) > a").href.replace("http://","https://");
        let title = elem.querySelector("span.text-primary").textContent.trim()

        elem.appendChild(pdfButton, elem);
        elem.appendChild(zipButton, elem);

        return [link, title];
    };

    templateFuncs.getChapterImageUrls = function(chapterUrl, buttonGroup, reportProgress) {
        return fetchText(chapterUrl, window.location.href).then((text) => {
            // convert text to html DOM
            let parser = new DOMParser();
            let doc = parser.parseFromString(text, "text/html");
            let scripts = doc.querySelectorAll("script");
            for (let script of scripts) {
                let parts = script.innerText.match(/const\s+chapterImages\s+=\s+JSON.parse\(`(.*)`\);/);
                if (parts !== null) {
                    return JSON.parse(parts[1]);
                }
            }
            throw "Image list not found";
        });
    };

    templateF(templateFuncs);
}
