function webtoonsF() {
    let templateFuncs = {};

    templateFuncs.isChapterListPage = function() {
        return document.querySelector("div.detail_lst") !== null;
    };

    templateFuncs.getChapterElems = function() {
        // this is just a convenient place to do this
        let batchButton = document.querySelector("button#md-batch-download-button");
        batchButton.classList.add("md-download-button");

        return document.querySelectorAll("div.detail_lst > ul#_listUl > li");
    };

    templateFuncs.insertNote = function(note) {
        let detailList = document.querySelector("div.detail_lst > ul#_listUl").parentNode;
        let chapterList = document.querySelector("div.detail_lst > ul#_listUl");
        detailList.insertBefore(note,chapterList);
    };

    templateFuncs.processChapterElem = function(elem, pdfButton, zipButton) {
        pdfButton.classList.add("md-download-button");
        zipButton.classList.add("md-download-button");

        let link = elem.querySelector("a").href;
        let title = elem.querySelector("span.subj > span").textContent;

        let buttonHolder = document.createElement("span");
        buttonHolder.style.cssText = "padding-top: 0;padding-bottom: 15px;";
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
            let imgs = doc.querySelectorAll("div#_imageList > img._images");

            let chapImgs = [];
            for(let img of imgs){
                chapImgs.push(img.dataset.url);
            }

            return chapImgs;
        });
    };

    templateF(templateFuncs);
}
