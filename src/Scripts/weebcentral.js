function weebcentralF() {
    let templateFuncs = {};

    templateFuncs.isChapterListPage = function() {
        return document.querySelector("div#chapter-list") !== null;
    };

    templateFuncs.waitChaptersLoaded = function() {
        return new Promise((resolve, reject) => {
            function loop(){
                let showAllChapters = document.querySelector("div#chapter-list > button");
                if (showAllChapters === null) {
                    resolve(true);
                } else {
                    // show hidden chapters
                    showAllChapters.click();
                    setTimeout(loop, 500);
                }
            }
            loop();
        });
    };

    templateFuncs.getChapterElems = function() {
        // this is just a convenient place to do these
        let batchButton = document.querySelector("button#md-batch-download-button");
        batchButton.classList.add("md-download-button");
        let floatChapterList = document.getElementById("md-float-chapter-list");
        floatChapterList.style.border = "1px solid";
        floatChapterList.style.padding = "10px";

        return document.querySelectorAll("div#chapter-list > div > a");
    };

    templateFuncs.insertNote = function(note) {
        let chapterDiv = document.querySelector("div#chapter-list");
        chapterDiv.insertBefore(note, chapterDiv.firstChild);
    };

    templateFuncs.processChapterElem = function(elem, pdfButton, zipButton) {
        pdfButton.classList.add("md-download-button");
        zipButton.classList.add("md-download-button");

        let link = elem.href;
        let title = elem.querySelector("span:nth-child(2) > span").textContent;

        elem.parentElement.appendChild(pdfButton, elem);
        elem.parentElement.appendChild(zipButton, elem);


        return [link, title];
    };

    templateFuncs.getChapterImageUrls = function(chapterUrl, buttonGroup, reportProgress) {
        return fetchText(chapterUrl, window.location.href).then((text) => {
            // convert text to html DOM
            let parser = new DOMParser();
            let doc = parser.parseFromString(text, "text/html");

            let imgListUrl = new URL(doc.getElementById("last-chapter-top").nextElementSibling.getAttribute("hx-get"));
            imgListUrl.search = "?is_prev=False&current_page=1&reading_style=long_strip";

            return fetchText(imgListUrl.href, chapterUrl).then((imgListText) => {
                let imgList = parser.parseFromString(imgListText, "text/html");
                let imgs = imgList.querySelectorAll("section > img");

                let chapImgs = [];
                for(let img of imgs){
                    chapImgs.push(img.src);
                }

                return chapImgs;
            });
        });
    };

    templateF(templateFuncs);
}
