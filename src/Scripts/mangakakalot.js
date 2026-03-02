function mangakakalotF() {
    let templateFuncs = {};

    templateFuncs.isChapterListPage = function() {
        return document.querySelector("div.manga-info-chapter") !== null;
    };

    templateFuncs.waitChaptersLoaded = function() {
        return new Promise((resolve, reject) => {
            let loops = 0;
            function checkLoop() {
                if (document.querySelector("p.chapter-loading-text") === null) {
                    resolve(true);
                } else if(loops++ < 60){
                    setTimeout(checkLoop,1000);
                } else {
                    resolve(false);
                }
            }
            checkLoop();
        });
    };


    templateFuncs.getChapterElems = function() {
        return document.querySelectorAll("div.chapter-list > div.row");
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
