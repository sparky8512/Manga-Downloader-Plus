function kiryuuF() {
    let templateFuncs = {};

    templateFuncs.isChapterListPage = function() {
        return document.querySelector("div#chapterlist") !== null;
    };

    templateFuncs.getChapterElems = function() {
        return document.querySelectorAll("div#chapterlist > ul > li");
    };

    templateFuncs.insertNote = function(note) {
        let chapterDiv = document.querySelector("div.bixbox.epcheck");
        chapterDiv.insertBefore(note,chapterDiv.firstChild);
    };

    templateFuncs.processChapterElem = function(elem, pdfButton, zipButton) {
        let link = elem.querySelector("div.eph-num a").href;
        let title = elem.querySelector("div.eph-num span.chapternum").textContent.trim();

        let buttonHolder = elem.querySelector("div.dt");
        buttonHolder.appendChild(pdfButton);
        buttonHolder.appendChild(zipButton);

        return [link, title];
    };

    templateFuncs.getChapterImageUrls = function(chapterUrl, buttonGroup, reportProgress) {
        return fetchText(chapterUrl, window.location.href).then((text) => {
            // convert text to html DOM
            let parser = new DOMParser();
            let doc = parser.parseFromString(text, "text/html");
            let imgs = doc.querySelectorAll("div#readerarea img");

            let chapImgs = [];
            for (let img of imgs) {
                chapImgs.push(img.src);
            }

            return chapImgs;
        });
    };

    templateF(templateFuncs);
}
