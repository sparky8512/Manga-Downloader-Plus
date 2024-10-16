function mangakakalotF() {
    let templateFuncs = {};

    templateFuncs.isChapterListPage = function() {
        return document.querySelector("div.manga-info-chapter") !== null;
    };

    templateFuncs.getChapterElems = function() {
        return document.querySelectorAll("div.chapter-list > div.row");
    };

    templateFuncs.insertNote = function(note) {
        let chapterDiv = document.querySelector("div.manga-info-chapter").parentNode;
        chapterDiv.insertBefore(note,chapterDiv.firstChild);
    };

    templateFuncs.processChapterElem = function(elem, pdfButtons, zipButtons) {
        // highlight row when hover
        elem.classList.add("md-mangakakalot-highlight");

        // store chapter link
        let link = elem.querySelector("a").href;
        let title = elem.querySelector("a").textContent;

        let buttonHolder = document.createElement("div");
        buttonHolder.style.cssText = "text-align: right;width: 100%; color: #667";
        let text1 = document.createElement("p");
        text1.style.display = "inline";
        text1.textContent = "Server 1 ";
        let text2 = document.createElement("p");
        text2.style.display = "inline";
        text2.textContent = " ---- Server 2 ";

        buttonHolder.appendChild(text1);
        buttonHolder.appendChild(pdfButtons[0]);
        buttonHolder.appendChild(zipButtons[0]);
        buttonHolder.appendChild(text2);
        buttonHolder.appendChild(pdfButtons[1]);
        buttonHolder.appendChild(zipButtons[1]);

        elem.appendChild(buttonHolder);

        return [link, title];
    };

    templateFuncs.getChapterImageUrls = function(chapterUrl, buttonGroup, reportProgress) {
        return fetchText(chapterUrl, window.location.href).then((text) => {
            // convert text to html DOM
            let parser = new DOMParser();
            let doc = parser.parseFromString(text, "text/html");
            let serverButtons = doc.querySelectorAll("div.panel-option span.pn-op-sv-img-btn");
            let serversCount = serverButtons.length;

            if (serversCount < 2 && buttonGroup == 1) {
                throw "No server 2 for this chapter";
            }

            let server;
            if (buttonGroup == 0) {
                server = "https://mangakakalot.com/change_content_s1";
            } else {
                server = "https://mangakakalot.com/change_content_s2";
            }
            return fetchText(server, chapterUrl).then((html) => {
                let parser = new DOMParser();
                let doc = parser.parseFromString(html, "text/html");
                let imgs = doc.querySelectorAll("div.container-chapter-reader img");

                let chapImgs = [];
                for (let img of imgs) {
                    chapImgs.push(img.src);
                }

                return chapImgs;
            });
        });
    };

    templateF(templateFuncs, ["Server 1", "Server 2"]);
}
