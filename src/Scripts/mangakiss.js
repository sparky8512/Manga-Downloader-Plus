function mangakissF() {
    let host = window.location.host;

    let templateFuncs = {};

    templateFuncs.isChapterListPage = function() {
        // determined in wait function
        return true;
    };

    templateFuncs.waitChaptersLoaded = function() {
        return new Promise((resolve, reject) => {
            let loops = 0;
            let loopCalled = false;

            switch (host) {
                case "mangakiss.org":
                case "manhuaus.com":
                    if(document.querySelector("div.listing-chapters_wrap") !== null){
                        loops = 0;
                        doLoop();
                    } else {
                        resolve(false);
                    }
                    break;
                case "manhuaplus.com":
                    if(document.querySelector("div.listing-chapters_wrap") !== null){
                        loops = 0;
                        doLoop();
                    }
                    else{
                        loops = 0;
                        wait();
                    }
                    break;
                default:
                    start();
                    break;
            }

            function wait(){
                if(document.querySelector("div.listing-chapters_wrap") !== null){
                    loops = 0;
                    doLoop();
                }else{
                    if(loops < 60){
                        loops++;
                        setTimeout(wait,1000);
                    } else {
                        resolve(false);
                    }
                }
            }
            function doLoop(){
                if (document.readyState == "complete") {
                    if(!loopCalled){
                        loopCalled = true;
                        loops = 0;
                        loop();
                    }
                }
                else{
                    window.addEventListener('load', function () {
                        if(!loopCalled){
                            loopCalled = true;
                            loops = 0;
                            loop();
                        }
                    });
                }
            }
            // loop for 60s for the chapters to show
            function loop() {
                if(document.querySelector("div.listing-chapters_wrap > i.fa-spinner")){
                    if(loops < 60){
                        loops++;
                        setTimeout(loop,1000);
                    } else {
                        resolve(false);
                    }
                }
                else{
                    start();
                }
            }

            function start(){
                // check if viewing chapters list page
                resolve(document.querySelector("div.listing-chapters_wrap") !== null);
            }
        });
    };

    templateFuncs.getChapterElems = function() {
        return document.querySelectorAll("li.wp-manga-chapter");
    };

    templateFuncs.insertNote = function(note) {
        let chapterDiv = document.querySelector("div.listing-chapters_wrap");
        chapterDiv.insertBefore(note,chapterDiv.firstChild);
    };

    templateFuncs.processChapterElem = function(elem, pdfButton, zipButton) {
        let link = elem.querySelector("a").href;
        let title = elem.querySelector("a").textContent.trim();

        elem.insertBefore(zipButton,elem.firstChild);
        elem.insertBefore(pdfButton,elem.firstChild);

        return [link, title];
    };

    templateFuncs.getChapterImageUrls = function(chapterUrl, buttonGroup, reportProgress) {
        return fetchText(chapterUrl, window.location.href).then((text) => {
            // convert text to html DOM
            let parser = new DOMParser();
            let doc = parser.parseFromString(text, "text/html");
            let imgs = doc.querySelectorAll("div.page-break > img.wp-manga-chapter-img");
            if(host === "manhuaplus.com"){
                imgs = doc.querySelectorAll("div.reading-content p > img");
            }

            let chapImgs = [];
            for(let img of imgs){
                let src = img.dataset.src !== undefined ? img.dataset.src : img.dataset.lazySrc;
                src = src === undefined ? img.src : src.trim();
                chapImgs.push(src);
            }

            return chapImgs;
        });
    };

    templateF(templateFuncs);
}
