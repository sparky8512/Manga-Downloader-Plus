function mangatownF() {
   let templateFuncs = {};

    templateFuncs.isChapterListPage = function() {
        return document.querySelector("div.chapter_content ul.chapter_list") !== null;
    };

    templateFuncs.getChapterElems = function() {
        return document.querySelectorAll("ul.chapter_list > li");
    };

    templateFuncs.insertNote = function(note) {
        let chapterDiv = document.querySelector("div.chapter_content");
        chapterDiv.insertBefore(note,chapterDiv.firstChild);
    };

    templateFuncs.processChapterElem = function(elem, pdfButton, zipButton) {
        let link = elem.querySelector("a").href;
        let title = elem.querySelector("a").textContent.trim();

        elem.insertBefore(zipButton, elem.firstChild);
        elem.insertBefore(pdfButton, elem.firstChild);

        return [link, title];
    };

    templateFuncs.getChapterImageUrls = function(chapterUrl, buttonGroup, reportProgress) {
        return fetchText(chapterUrl, window.location.href).then((text) => {
            // convert text to html DOM
            let parser = new DOMParser();
            let doc = parser.parseFromString(text, "text/html");

            let chapImgs = [];

            let imgs = doc.querySelectorAll("div.read_img img.image");
            if(imgs.length > 0){
                for(let img of imgs){
                    chapImgs.push(img.src);
                }

                return chapImgs;
            }

            // get number of pages as string then converting it to an integer
            let scripts = doc.querySelectorAll("script");

            let exist = false;
            let script;
            for(let scr of scripts){
                script = scr.textContent.trim();
                if(script.includes("total_pages")){
                    exist = true;
                    break;
                }
            }
            if(!exist){
                throw "Couldn't find page count";
            }
            let str = script.slice(script.indexOf("total_pages"), script.length);
            str = str.slice(str.indexOf("=")+1, str.indexOf(";"));
            let pagesNum = parseInt(str.trim());

            // save off first image URL, since we already have it
            let img = doc.querySelector("div.read_img img#image");
            chapImgs.push(img.src);
            if (pagesNum < 2) {
                return chapImgs;
            }

            function getPageImage(page) {
                let pageUrl = chapterUrl.endsWith("/") ? chapterUrl : chapterUrl+"/";
                pageUrl += page+".html";
                return fetchText(pageUrl, window.location.href).then((text) => {
                    // if the request succeed
                    let parser = new DOMParser();
                    let doc = parser.parseFromString(text, "text/html");
                    let img = doc.querySelector("div.read_img img#image");
                    // storing img link in button for easy access
                    chapImgs.push(img.src);
                    reportProgress(page/pagesNum);
                    // if all links are found make pdf/zip file
                    if (page >= pagesNum) {
                        return chapImgs;
                    } else {
                        return getPageImage(page + 1);
                    }
                });
            }
            reportProgress(1/pagesNum);
            return getPageImage(2);
        });
    };

    templateF(templateFuncs);
}
