function mangasee123F() {
    // to store links of each chapter
    let links = [];
    // get all the rows
    let rows;
    // to store download button for easy access
    let pdfButtons = [];
    let zipButtons = [];
    // to store all chapters images for batch Download (store the buttons)
    let chaptersData = [];
    if(document.querySelector("div.list-group > a.ChapterLink") !== null){
        addNote();
        if(document.querySelector("div.ShowAllChapters")){
            loop();
        }
        else {
            addBatchDownload();
            addDownloadButtons();
        }
    }

    function loop(){
        if(document.querySelector("div.ShowAllChapters") !== null){
            // show hidden chapters
            let showAllChapters = document.querySelector("div.ShowAllChapters");
            showAllChapters.click();
            setTimeout(loop,500);
        }
        else{
            addBatchDownload();
            addDownloadButtons();
        }
    }
    // add a note for users
    function addNote(){
        let chapterDiv = document.querySelector("div.list-group");
        let note = document.createElement("span");
        note.id = "md-note";
        note.style.fontSize = "x-large";
        note.style.color = "black";
        chapterDiv.insertBefore(note,chapterDiv.firstChild);
    }
    // add download button for each chapter
    function addDownloadButtons(){
        rows = document.querySelectorAll("div.list-group > a.ChapterLink");
        for (let i=0;i<rows.length;i++) {
            let pdfButton = document.createElement("button");
            let zipButton = document.createElement("button");
            pdfButton.textContent = "pdf";
            zipButton.textContent = "zip";
            // disable the button until fetching images links
            pdfButton.disabled = "true";
            zipButton.disabled = "true";
            // store chapter link
            let chapterLink = rows[i].href;
            chapterLink = chapterLink.replace("-page-1","");
            links[i] = chapterLink;
            pdfButton.referrerLink = chapterLink;

            pdfButton.title = rows[i].querySelector("span").innerText.trim();
            zipButton.title = pdfButton.title;

            // create wrapper container
            let wrapper = document.createElement('span');
            wrapper.style.display = "inherit";
            // insert wrapper before el in the DOM tree
            rows[i].parentNode.insertBefore(wrapper, rows[i]);
            // move el into wrapper
            wrapper.appendChild(rows[i]);
            rows[i].style.width = "100%";

            wrapper.insertBefore(zipButton,wrapper.firstChild);
            wrapper.insertBefore(pdfButton,wrapper.firstChild);
            
            // storing download button for easy access
            pdfButtons.push(pdfButton);
            zipButtons.push(zipButton);
            {
                let id = i;
                let chapterCount = rows.length;
                fetchText(links[id], window.location.href).then((text) => {
                    let waitNote = document.querySelector("span#md-batch-note");
                    let pdfButton = pdfButtons[id];
                    let zipButton = zipButtons[id];
                    // convert text to html DOM
                    let parser = new DOMParser();
                    let doc = parser.parseFromString(text, "text/html");
                    let scripts = doc.querySelectorAll("script");

                    let exist = false;
                    let script;
                    for(let scr of scripts){
                        script = scr.textContent.trim();
                        if(script.includes("vm.CurChapter = {")){
                            exist = true;
                            break;
                        }
                    }
                    if(!exist){
                        return;
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

                    pdfButton.imgs = [];
                    zipButton.imgs = [];

                    for(let i=1; i<=curChapter.Page;i++){
                        let pathName = window.location.pathname;
                        let url = "https://"+curPathName + pathName + "/";
                        url += curChapter.Directory == "" ? "" : curChapter.Directory + "/";
                        url += chapterImage(curChapter.Chapter) + "-" + pageImage(i) + ".png";

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
                }).catch((err) => {
                    console.log("Failed to get "+links[id]);
                    pdfButton.textContent = "Not Found";
                    zipButton.style.display = "none";
                });
            }
        }
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

        pdfButtonBatch.addEventListener("click", function(){
            if(floatDivChapterList.selectedOptions.length > 0){
                batchEmbedImages(pdfButtonBatch,zipButtonBatch,1,floatDivChapterList,batchProgressBar);
            }
        });

        zipButtonBatch.addEventListener("click", function(){
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
                option.disabled = "true";
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
}
