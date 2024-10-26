function manganeloF() {
    let templateFuncs = {};

    templateFuncs.isChapterListPage = function() {
        return document.querySelector("div.panel-story-chapter-list") !== null;
    };

    templateFuncs.getChapterElems = function() {
        return document.querySelectorAll("ul.row-content-chapter > li");
    };

    templateFuncs.insertNote = function(note) {
        let chapterDiv = document.querySelector("div.panel-story-chapter-list");
        chapterDiv.insertBefore(note,chapterDiv.firstChild);
    };

    templateFuncs.processChapterElem = function(elem, pdfButtons, zipButtons) {
        let link = elem.querySelector("a").href;
        let title = elem.querySelector("a").textContent;
        // title attribute has manga title in it, but is broken in other ways,
        // use a combination
        let parts = elem.querySelector("a").title.match(/(.*) chapter /);
        if (parts !== null) {
            title = parts[1] + " " + title;
        }

        let buttonHolder = document.createElement("li");
        buttonHolder.style.cssText = "text-align: right;";
        let text1 = document.createElement("span");
        text1.textContent = "Server 1 ";
        let text2 = document.createElement("span");
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
            let serverButtons = doc.querySelectorAll("a.server-image-btn");
            let serversCount = serverButtons.length;

            if (serversCount < 2 && buttonGroup == 1) {
                throw "No server 2 for this chapter";
            }

            let server;
            let hostname = window.location.hostname;
            if (hostname.endsWith("manganelo.com")) {
                if (buttonGroup == 0) {
                    server = "https://chapmanganelo.com/content_server_s1";
                } else {
                    server = "https://chapmanganelo.com/content_server_s2";
                }
            } else {
                if (buttonGroup == 0) {
                    server = "https://chapmanganato.to/content_server_s1";
                } else {
                    server = "https://chapmanganato.to/content_server_s2";
                }
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
