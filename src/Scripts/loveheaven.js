function loveheavenF(){
    let templateFuncs = {};

    templateFuncs.isChapterListPage = function() {
        return document.querySelector("div#tab-chapper div#list-chapter") !== null;
    };

    templateFuncs.waitChaptersLoaded = function() {
        return new Promise((resolve, reject) => {
            let loops = 0;
            function checkLoop() {
                // Chapter list sometimes takes a while to load if there is a modal pop-up
                if (document.querySelector("div#list-chapter table.table") !== null) {
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
        let chapterList = document.querySelector("div#list-chapter table.table");
        return chapterList.querySelectorAll("tr");
    };

    templateFuncs.insertNote = function(note) {
        let chapterDiv = document.querySelector("div#tab-chapper");
        chapterDiv.parentElement.insertBefore(note,chapterDiv.previousElementSibling);
    };

    templateFuncs.processChapterElem = function(elem, pdfButton, zipButton) {
        let link = elem.querySelector("a").href;
        let title = elem.querySelector("a").title.trim();

        // create new table cells to append download button for each chapter
        let newCell = document.createElement("td");
        newCell.appendChild(pdfButton);
        newCell.appendChild(zipButton);
        newCell.style.width = "min-content";
        elem.appendChild(newCell);

        return [link, title];
    };

    function getRandom(len){
        let symbols = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        let numSymbols = symbols.length;
        let result = "";
        for (let i=0; i < len; i++) {
            result += symbols.charAt(Math.floor(Math.random() * numSymbols));
        }
        return result;
    }

    templateFuncs.getChapterImageUrls = function(chapterUrl, buttonGroup, reportProgress) {
        return fetchText(chapterUrl, window.location.href).then((text) => {
            // convert text to html DOM
            let parser = new DOMParser();
            let doc = parser.parseFromString(text, "text/html");
            let cid = parseInt(doc.getElementById("chapter").value);
            let rand = getRandom(30);
            let url = (new URL(chapterUrl)).origin+"/"+rand+".iog?cid="+cid;
            return fetchText(url, chapterUrl).then((html) => {
                let parser = new DOMParser();
                let doc = parser.parseFromString(html, "text/html");
                let imgs = doc.querySelectorAll("img.chapter-img");

                let chapImgs = [];
                for (let img of imgs) {
                    chapImgs.push(img.src);
                }
                return chapImgs;
            });
        });
    };

    templateF(templateFuncs);
}
