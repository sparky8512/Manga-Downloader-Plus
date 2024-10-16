function mangasailF() {
    let templateFuncs = {};

    templateFuncs.isChapterListPage = function() {
        return document.querySelector("table.chlist") !== null;
    };

    templateFuncs.getChapterElems = function() {
        let chapterList = document.querySelector("table.chlist");

        // add a header for download row
        let tableHeader = chapterList.querySelector("thead > tr");
        let downloadHeader = document.createElement("th");
        downloadHeader.textContent = "Download";
        tableHeader.appendChild(downloadHeader);

        return chapterList.querySelectorAll("tbody > tr");
    };

    templateFuncs.insertNote = function(note) {
        let chapterDiv = document.querySelector("table.chlist");
        chapterDiv.parentElement.insertBefore(note,chapterDiv);
    };

    templateFuncs.processChapterElem = function(elem, pdfButton, zipButton) {
        let link = elem.querySelector("a").href;
        let title = elem.querySelector("td").textContent.trim();

        // create new table cells to append download button for each chapter
        let newCell = document.createElement("td");
        newCell.appendChild(pdfButton);
        newCell.appendChild(zipButton);
        elem.appendChild(newCell);

        return [link, title];
    };

    templateFuncs.getChapterImageUrls = function(chapterUrl, buttonGroup, reportProgress) {
        return fetchText(chapterUrl, window.location.href).then((text) => {
            // convert text to html DOM
            let parser = new DOMParser();
            let doc = parser.parseFromString(text, "text/html");
            let scripts = doc.querySelectorAll("script");

            let exist = false;
            let script;
            for(let scr of scripts){
                script = scr.textContent.trim();
                if(script.includes("\"showmanga\":")){
                    exist = true;
                    break;
                }
            }
            if(!exist){
                throw "Image list not found";
            }
            
            let startIndex = script.indexOf("{");
            let endIndex = script.indexOf("});")+1;
            let str = script.slice(startIndex, endIndex);
            let chapterData = JSON.parse(str);
            let imagesData = chapterData.showmanga.paths;

            let chapImgs = [];

            for(let img of imagesData){
                if(img.startsWith("https://") || img.startsWith("http://")){
                    chapImgs.push(img);
                }
            }

            return chapImgs;
        });
    };

    templateF(templateFuncs);
}
