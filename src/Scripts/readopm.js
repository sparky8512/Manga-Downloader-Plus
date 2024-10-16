function readopmF() {
    let templateFuncs = {};

    templateFuncs.isChapterListPage = function() {
        return document.querySelector("div.card-table > div.card-body > table.table") !== null;
    };

    templateFuncs.getChapterElems = function() {
        return document.querySelectorAll("div.card-table > div.card-body > table.table > tbody > tr");
    };

    templateFuncs.insertNote = function(note) {
        let chapterDiv = document.querySelector("div.card-table");
        chapterDiv.parentElement.insertBefore(note,chapterDiv);
    };

    templateFuncs.processChapterElem = function(elem, pdfButton, zipButton) {
        let title = elem.firstElementChild.textContent;
        let link = elem.querySelector("a.btn-primary").href;

        let holder = elem.querySelector("a.btn-primary").parentElement.parentElement;
        holder.appendChild(pdfButton);
        holder.appendChild(zipButton);

        return [link, title];
    };

    templateFuncs.getChapterImageUrls = function(chapterUrl, buttonGroup, reportProgress) {
        return fetchText(chapterUrl, window.location.href).then((text) => {
            // convert text to html DOM
            let parser = new DOMParser();
            let doc = parser.parseFromString(text, "text/html");
            let imgs = doc.querySelectorAll("div.pages img.pages__img");

            let chapImgs = [];
            for(let img of imgs){
                chapImgs.push(img.src);
            }

            return chapImgs;
        });
    };

    templateF(templateFuncs);
}
