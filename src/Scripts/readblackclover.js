function readblackcloverF() {
    let templateFuncs = {};

    templateFuncs.isChapterListPage = function() {
        return document.querySelector("div.bg-bg-secondary > div.grid div.col-span-4 a") !== null;
    };

    templateFuncs.getChapterElems = function() {
        // this is just a convenient place to do this
        let batchButton = document.querySelector("button#md-batch-download-button");
        batchButton.classList.add("md-download-button");

        let chapterElems = [];
        for (elem of document.querySelectorAll("div.bg-bg-secondary > div.grid")) {
            if (elem.querySelector("div.col-span-4 a") !== null) {
                chapterElems.push(elem);
            }
        }
        return chapterElems;
    };

    templateFuncs.insertNote = function(note) {
        let chapterDiv = document.querySelector("div.bg-bg-secondary > div.grid > div.col-span-4").parentElement.parentElement;
        chapterDiv.parentElement.insertBefore(note,chapterDiv);
    };

    templateFuncs.processChapterElem = function(elem, pdfButton, zipButton) {
        // get title
        let title = elem.querySelector("div.col-span-4 a").textContent;
        title += " "+elem.querySelector("div.col-span-4 div.text-xs").textContent;
        // store chapter link
        let link = elem.querySelector("div.lg\\:col-span-1 a").href;

        pdfButton.classList.add("md-download-button");
        zipButton.classList.add("md-download-button");

        let holder = elem.querySelector("div.lg\\:col-span-1 a").parentElement;
        holder.appendChild(pdfButton);
        holder.appendChild(zipButton);

        return [link, title];
    };

    templateFuncs.getChapterImageUrls = function(chapterUrl, buttonGroup, reportProgress) {
        return fetchText(chapterUrl, window.location.href).then((text) => {
            // convert text to html DOM
            let parser = new DOMParser();
            let doc = parser.parseFromString(text, "text/html");
            let imgs = doc.querySelectorAll("div.js-pages-container img.js-page");

            let chapImgs = [];
            for(let img of imgs){
                chapImgs.push(img.src);
            }

            return chapImgs;
        });
    };

    templateF(templateFuncs);
}
