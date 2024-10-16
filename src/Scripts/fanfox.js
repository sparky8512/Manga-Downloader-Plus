function fanfoxF() {
    // to store links of each chapter
    let links = [];
    // get all chapters displayed in the table
    let rows;
    // to store download button for easy access
    let pdfButtons = [];
    let zipButtons = [];
    // to store all chapters images for batch Download (store the buttons)
    let chaptersData = [];
    // check if viewing chapters list page
    if(document.querySelector("div#chapterlist") !== null){
        rows = document.querySelectorAll("div#chapterlist ul.detail-main-list > li");
        addNote();
        addBatchDownload();
        addDownloadButtons();
    }
    // add a note for users
    function addNote(){
        let chapterDiv = document.querySelector("div#chapterlist");
        let note = document.createElement("span");
        note.id = "md-note";
        note.style.fontSize = "x-large";
        note.style.color = "black";
        chapterDiv.insertBefore(note,chapterDiv.firstChild);
    }
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
    function fetchChapData(pdfButton, zipButton, page, ref){
        dataUrl = new URL("chapterfun.ashx?cid="+pdfButton.cid+"&page="+page+"&key="+pdfButton.token, ref);
        return fetch(dataUrl,{referrer:ref}).then((res) => {
            if(res.ok) {
                return res.text();
            }
            throw res.status;
        }).then((text) => {
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
                pdfButton.imgs.push(url);
                zipButton.imgs.push(url);
            }
        });
    }
    // add download buttons 
    function addDownloadButtons(){
        for (let i=0;i<rows.length;i++) {
            let pdfButton = document.createElement("button");
            let zipButton = document.createElement("button");

            pdfButton.textContent = "pdf";
            zipButton.textContent = "zip";

            // store chapter link
            links[i] = rows[i].querySelector("a").href;
            pdfButton.referrerLink = rows[i].querySelector("a").href;

            pdfButton.title = rows[i].querySelector("a").title.trim();
            zipButton.title = pdfButton.title;
            pdfButton.disabled = "true";
            zipButton.disabled = "true";
            rows[i].appendChild(pdfButton,rows[i]);
            rows[i].appendChild(zipButton,rows[i]);

            // storing download button for easy access
            pdfButtons.push(pdfButton);
            zipButtons.push(zipButton);

            let xhttp = new XMLHttpRequest();
            // added id to each xhttp request to know what button called it					
            xhttp.id = i;
            xhttp.chapterCount = rows.length;
            xhttp.onreadystatechange = function () {
                let waitNote = document.querySelector("span#md-batch-note");
                let id = this.id;
                let chapterCount = this.chapterCount;
                let pdfButton = pdfButtons[id];
                let zipButton = zipButtons[id];
                // in case the page does not exist display and abort request
                if(this.status === 404){
                    pdfButton.textContent = "Not Found";
                    zipButton.style.display = "none";
                    this.abort();
                }
                // if the request succeed
                if (this.readyState === 4 && this.status === 200) {
                    // convert text to html DOM
                    let parser = new DOMParser();
                    let doc = parser.parseFromString(this.responseText, "text/html");
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
                            pdfButton.imgs = [];
                            zipButton.imgs = [];
                            for(let img of imgs){
                                let url = (new URL(img, links[id])).href;
                                pdfButton.imgs.push(url);
                                zipButton.imgs.push(url);
                            }

                            // store the button with all the images for batch download
                            chaptersData[id] = {
                                title: pdfButton.title,
                                images: pdfButton.imgs,
                                referrerLink: links[id]
                            };
                            // check if all buttons are add
                            let len = chaptersData.reduce((acc,cv)=>(cv)?acc+1:acc,0);
                            waitNote.textContent = "wait, "+len+"/"+chapterCount+" Chapters.";
                            if(len === chapterCount){
                                addChaptersToList();
                            }

                            pdfButton.removeAttribute("disabled");
                            zipButton.removeAttribute("disabled");
                            pdfButton.addEventListener("click", function(){embedImages(pdfButton,zipButton,1);});
                            zipButton.addEventListener("click", function(){embedImages(pdfButton,zipButton,2);});
                            return;
                        }
                        else if(unpacked.startsWith("var guidkey=\\'")){
                            //let parts = unpacked.match(/var\\w+pix="([^\"]*)\";/);
                            let parts = unpacked.match(/guidkey=\\'([^;]*)\\';/);
                            if(parts === null) {
                                continue;
                            }
                            pdfButton.token = parts[1].replaceAll("\\'+\\'","");
                            parts = this.responseText.match(/var\s+chapterid\s*=\s*([^;]*)\s*;/);
                            pdfButton.cid = parts[1];
                            parts = this.responseText.match(/var\s+imagecount\s*=\s*([^;]*)\s*;/);
                            pdfButton.pages = parseInt(parts[1]);
                            pdfButton.imgs = [];
                            zipButton.imgs = [];

                            fetchChapData(pdfButton, zipButton, 1, links[id]).then(() => {
                                // store the button with all the images for batch download
                                chaptersData[id] = {
                                    title: pdfButton.title,
                                    images: pdfButton.imgs,
                                    referrerLink: links[id]
                                };
                                // check if all buttons are add
                                let len = chaptersData.reduce((acc,cv)=>(cv)?acc+1:acc,0);
                                waitNote.textContent = "wait, "+len+"/"+chapterCount+" Chapters.";
                                if(len === chapterCount){
                                    addChaptersToList();
                                }

                                pdfButton.removeAttribute("disabled");
                                zipButton.removeAttribute("disabled");
                                pdfButton.addEventListener("click", function(){getServerImages(pdfButton,zipButton,1,links[id]);});
                                zipButton.addEventListener("click", function(){getServerImages(pdfButton,zipButton,2,links[id]);});
                            }).catch((error) => {
                                console.log("Failed data fetch: "+error);
                                pdfButton.textContent = "Not Found";
                                zipButton.style.display = "none";
                            });
                            return;
                        }
                    }
                    pdfButton.textContent = "Not Found";
                    zipButton.style.display = "none";
                }
            };
            xhttp.onerror = function (){
                console.log("Failed to get "+links[i]);
            };
            xhttp.open("GET", links[i]);
            xhttp.send();
        }
    }
    async function getServerImages(pdfButton,zipButton,type, ref) {
        pdfButton.disabled = "true";
        zipButton.disabled = "true";

        while(pdfButton.imgs.length < pdfButton.pages) {
            try {
                await fetchChapData(pdfButton, zipButton, pdfButton.imgs.length+1, ref);
            } catch(error) {
                console.log("Failed data fetch: "+error);
                pdfButton.removeAttribute("disabled");
                zipButton.removeAttribute("disabled");
                return;
            }
        }
        embedImages(pdfButton,zipButton,type);
    }
    // add batch download button
    function addBatchDownload(){
        // add the floatDiv to document body
        let floatDiv = document.createElement("div");
        floatDiv.id = "md-floatDiv";
        floatDiv.classList.add("md-float-modal");
        let floatDivContent = document.createElement("div");
        floatDivContent.classList.add("md-float-modal-content");
        let floatCloseButton = document.createElement("span");
        floatCloseButton.classList.add("md-float-close");
        floatCloseButton.innerHTML = "&times;";

        floatDivContent.appendChild(floatCloseButton);
        floatDiv.appendChild(floatDivContent);
        document.body.appendChild(floatDiv);

        // to close floating div
        floatCloseButton.onclick = function() {
            floatDiv.style.display = "none";
        };

        // create the button that show the floatDiv
        let batchDownloadButton = document.createElement("button");
        batchDownloadButton.textContent = "Batch Download";
        batchDownloadButton.id = "md-batch-download-button";
        batchDownloadButton.title = "Download multiple chapters at once";
        batchDownloadButton.classList.add("md-download-button");
        batchDownloadButton.disabled = "true";
        
        let waitNote = document.createElement("span");
        waitNote.textContent = "wait, getting data from all chapters";
        waitNote.id = "md-batch-note";
        let holder = document.createElement("span");
        holder.appendChild(batchDownloadButton);
        holder.appendChild(waitNote);
        // append batch button after the note
        let theNote = document.querySelector("span#md-note");
        theNote.parentElement.insertBefore(holder,theNote.nextElementSibling);

        let floatDivChapterList = document.createElement("select");
        floatDivChapterList.id = "md-float-chapter-list";
        floatDivChapterList.size = 20;
        floatDivChapterList.multiple = true;

        floatDivContent.appendChild(floatDivChapterList);

        let pdfButtonBatch = document.createElement("button");
        pdfButtonBatch.classList.add("md-download-button");
        pdfButtonBatch.textContent = "Download Selected Chapter/s as PDF files";
        let zipButtonBatch = document.createElement("button");
        zipButtonBatch.classList.add("md-download-button");
        zipButtonBatch.textContent = "Download Selected Chapter/s as ZIP files";

        let buttonHolder = document.createElement("span");
        buttonHolder.appendChild(pdfButtonBatch);
        buttonHolder.appendChild(zipButtonBatch);

        floatDivContent.appendChild(buttonHolder);

        async function checkChapData() {
            let options = Array.from(floatDivChapterList.selectedOptions);
            for(option of options){
                let id = option.index;
                let pdfButton = pdfButtons[id];
                while(pdfButton.imgs.length < pdfButton.pages) {
                    try {
                        await fetchChapData(pdfButton, zipButtons[id], pdfButton.imgs.length+1, links[id]);
                    } catch(error) {
                        console.log("Failed data fetch: "+error);
                        option.selected = false;
                        option.disabled = true;
                        option.textContent += " FAILED";
                        break;
                    }
                }
            }
        }

        pdfButtonBatch.addEventListener("click", async function(){
            await checkChapData();
            if(floatDivChapterList.selectedOptions.length > 0){
                batchEmbedImages(pdfButtonBatch,zipButtonBatch,1,floatDivChapterList,batchProgressBar);
            }
        });

        zipButtonBatch.addEventListener("click", async function(){
            await checkChapData();
            if(floatDivChapterList.selectedOptions.length > 0){
                batchEmbedImages(pdfButtonBatch,zipButtonBatch,2,floatDivChapterList,batchProgressBar);
            }
        });

        let batchProgressContainer = document.createElement("div");
        batchProgressContainer.classList.add("md-progress-container");
        let batchProgressBar = document.createElement("div");
        batchProgressBar.classList.add("md-progress-bar");
        batchProgressBar.textContent = "0%";
        batchProgressBar.style.display = "none";

        batchProgressContainer.appendChild(batchProgressBar);
        floatDivContent.appendChild(batchProgressContainer);
    }
    // add chapters to list inside floatDiv
    function addChaptersToList(){
        let waitNote = document.querySelector("span#md-batch-note");
        waitNote.textContent = "wait, adding Chapters to list.";
        let floatDivChapterList = document.querySelector("select#md-float-chapter-list");

        for(let i=0 ;i<chaptersData.length ;i++){
            let option = document.createElement("option");
            option.textContent = chaptersData[i].title;
            option.value = chaptersData[i].title;
            option.imgs = chaptersData[i].images;
            if(option.imgs === 0){
                option.disabled = true;
            }
            option.ref = chaptersData[i].referrerLink;
            floatDivChapterList.appendChild(option);
        }

        waitNote.textContent = "Its Ready.";
        waitNote.style.display = "none";
        
        let batchDownloadButton = document.querySelector("button#md-batch-download-button");
        batchDownloadButton.onclick = function(){
            let floatDiv = document.querySelector("div#md-floatDiv");
            floatDiv.style.display = "block";
        };
        batchDownloadButton.removeAttribute("disabled");
    }
}
