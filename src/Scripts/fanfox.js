function fanfoxF() {
    let templateFuncs = {};

    templateFuncs.isChapterListPage = function() {
        return document.querySelector("div#chapterlist") !== null;
    };

    templateFuncs.getChapterElems = function() {
        return document.querySelectorAll("div#chapterlist ul.detail-main-list > li");
    };

    templateFuncs.insertNote = function(note) {
        let chapterDiv = document.querySelector("div#chapterlist");
        chapterDiv.insertBefore(note,chapterDiv.firstChild);
    };

    templateFuncs.processChapterElem = function(elem, pdfButton, zipButton) {
        let link = elem.querySelector("a").href;
        let title = elem.querySelector("a").title.trim();

        elem.appendChild(pdfButton, elem);
        elem.appendChild(zipButton, elem);

        return [link, title];
    };

    // unpack a script packed with Dean Edwards' packer
    function unpackPacker(packed){
        if(!packed.endsWith(".split('|'),0,{}))")){
            return null;
        }
        let start = packed.indexOf("}(");
        if(start == -1){
            return null;
        }
        let args = packed.slice(start+2, -18).match(/'((?:\\'|[^'])*)',([^,]*),([^,]*),'((?:\\'|[^'])*)'/);
        if(args === null){
            return null;
        }
        try {
            function unpack(p,a,c,k,e,r){
                if(a <= 10){
                    e = String;
                }
                else if(a <= 36){
                    e = function(c){
                        return c.toString(a);
                    }
                }
                else if(a <= 62){
                    e = function(c){
                        return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36));
                    }
                }
                else{
                    return null;
                }
                if(!''.replace(/^/,String)){
                    while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};
                    c=1;
                }
                while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);
                return p;
            }
            return unpack(args[1], parseInt(args[2]), parseInt(args[3]), args[4].split("|"), 0, {});
        } catch {
            return null;
        }
    }

    function fetchChapData(page, ref, token, cid, pages, chapImgs, reportProgress) {
        let dataUrl = new URL("chapterfun.ashx?cid="+cid+"&page="+page+"&key="+token, ref);
        return fetchText(dataUrl, ref).then((text) => {
            let unpacked = unpackPacker(text.trim());
            if(!unpacked.includes("pvalue=[")) {
                throw "Unrecognized page data";
            }
            let parts = unpacked.match(/var pvalue=(\[[^\]]*\]);/);
            if(parts === null){
                throw "No image list";
            }
            let imgs = JSON.parse(parts[1]);
            // sanity check to avoid infinite retry
            if(imgs.length == 0 && page > 1){
                throw "No more images?";
            }
            parts = unpacked.match(/var pix="([^"]*)";/);
            if(parts === null) {
                throw "No base URL";
            }
            let base = parts[1];
            parts = unpacked.match(/{pvalue\[i\]="([^"]*)"+/);
            let base0 = base;
            if(parts !== null) {
                base0 = parts[1];
            }

            for(let i=0; i<imgs.length; i++){
                let url = (new URL((i == 0 ? base0 : base)+imgs[i], ref)).href;
                chapImgs.push(url);
            }

            if (chapImgs.length < pages) {
                reportProgress(chapImgs.length/pages);
                return fetchChapData(chapImgs.length+1, ref, token, cid, pages, chapImgs, reportProgress);
            }
            return chapImgs;
        });
    }

    templateFuncs.getChapterImageUrls = function(chapterUrl, buttonGroup, reportProgress) {
        return fetchText(chapterUrl, window.location.href).then((text) => {
            // convert text to html DOM
            let parser = new DOMParser();
            let doc = parser.parseFromString(text, "text/html");
            let scripts = doc.querySelectorAll("script");
            for(let script of scripts){
                if(!script.innerText.includes("p,a,c,k,e,")){
                    continue;
                }
                let unpacked = unpackPacker(script.innerText.trim());
                if(unpacked.startsWith("var newImgs=[")){
                    let end = unpacked.indexOf("];var newImginfos=");
                    if(end == -1){
                        continue;
                    }
                    let imgs = JSON.parse(unpacked.slice(12, end+1).replaceAll("\\'",'"'));
                    for (let i=0; i<imgs.length; i++) {
                        imgs[i] = (new URL(imgs[i], chapterUrl)).href;
                    }
                    return imgs;
                }
                if (unpacked.startsWith("var guidkey=\\'")) {
                    let parts = unpacked.match(/guidkey=\\'([^;]*)\\';/);
                    if(parts === null) {
                        continue;
                    }
                    let token = parts[1].replaceAll("\\'+\\'","");
                    parts = text.match(/var\s+chapterid\s*=\s*([^;]*)\s*;/);
                    let cid = parts[1];
                    parts = text.match(/var\s+imagecount\s*=\s*([^;]*)\s*;/);
                    let pages = parseInt(parts[1]);

                    return fetchChapData(1, chapterUrl, token, cid, pages, [], reportProgress);
                }
            }
            throw "Image list not found";
        });
    };

    templateF(templateFuncs);
}
