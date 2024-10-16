function mangasee123F() {
    let templateFuncs = {};

    templateFuncs.isChapterListPage = function() {
        return document.querySelector("div.list-group > a.ChapterLink") !== null;
    };

    templateFuncs.waitChaptersLoaded = function() {
        return new Promise((resolve, reject) => {
            function loop(){
                let showAllChapters = document.querySelector("div.ShowAllChapters");
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

    templateFuncs.insertNote = function(note) {
        let chapterDiv = document.querySelector("div.list-group");
        chapterDiv.insertBefore(note,chapterDiv.firstChild);
    };

    templateFuncs.getChapterElems = function() {
        return document.querySelectorAll("div.list-group > a.ChapterLink");
    };

    templateFuncs.processChapterElem = function(elem, pdfButton, zipButton) {
        let chapterLink = elem.href;
        chapterLink = chapterLink.replace("-page-1","");

        let title = elem.querySelector("span").innerText.trim();

        // create wrapper container
        let wrapper = document.createElement('span');
        wrapper.style.display = "inherit";
        // insert wrapper before el in the DOM tree
        elem.parentNode.insertBefore(wrapper, elem);
        // move el into wrapper
        wrapper.appendChild(elem);
        elem.style.width = "100%";

        wrapper.insertBefore(zipButton,wrapper.firstChild);
        wrapper.insertBefore(pdfButton,wrapper.firstChild);

        return [chapterLink, title];
    };

    templateFuncs.getChapterImageUrls = function(chapterUrl, buttonGroup, reportProgress) {
        return fetchText(chapterUrl, window.location.href).then((text) => {
            // convert text to html DOM
            let parser = new DOMParser();
            let doc = parser.parseFromString(text, "text/html");
            let scripts = doc.querySelectorAll("script");

            let exist = false;
            let script;
            for (let scr of scripts) {
                script = scr.textContent.trim();
                if(script.includes("vm.CurChapter = {")){
                    exist = true;
                    break;
                }
            }
            if (!exist){
                throw "image list not found";
            }

            let dataIndex = script.indexOf("vm.CurChapter = {");
            let hostIndex = script.indexOf("vm.CurPathNamez = \"");
            if(hostIndex == -1){
                hostIndex = script.indexOf("vm.CurPathName = \"");
            }

            let data = script.slice(dataIndex, dataIndex + 500);
            data = data.slice(data.indexOf("{") , data.indexOf("}")+1);

            let curChapter = JSON.parse(data);

            let curPathName = script.slice(hostIndex, hostIndex +100);
            curPathName = curPathName.slice(curPathName.indexOf("\"")+1,curPathName.indexOf("\";"));

            let chapImgs = [];

            for (let i=1; i<=curChapter.Page; i++) {
                let pathName = window.location.pathname;
                let url = "https://"+curPathName + pathName + "/";
                url += curChapter.Directory == "" ? "" : curChapter.Directory + "/";
                url += chapterImage(curChapter.Chapter) + "-" + pageImage(i) + ".png";

                chapImgs.push(url);
            }

            return chapImgs;
        });
    };

    function chapterImage(chapterString){
        let chapter = chapterString.slice(1,-1);
        let odd = chapterString[chapterString.length -1];
        if(odd == 0){
            return chapter;
        }
        else{
            return chapter + "." + odd;
        }
    }
    
    function pageImage(pageString){
        let s = "000" + pageString;
        return s.substr(s.length - 3);
    }

    templateF(templateFuncs);
}
