function mangakissF() {
    let host = window.location.host;
    let loops = 0;
    let loopCalled = false;
    // to store links of each chapter
    let links = [];
    // to store download button for easy access
    let pdfButtons = [];
    let zipButtons = [];
    // to store all chapters images for batch Download (store the buttons)
    let chaptersData = [];
    switch (host) {
        case "mangakiss.org":
        case "manhuaus.com":
            if(document.querySelector("div.listing-chapters_wrap") !== null){
                loops = 0;
                doLoop();
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
            }
        }
        else{
            start();
        }
    }
    function start(){
        // check if viewing chapters list page
        if(document.querySelector("div.listing-chapters_wrap") !== null){
            // calling function
            addNote();
            addBatchDownload();
            addDownloadButtons();
        }
    }
    // add a note for users
    function addNote(){
        let chapterDiv = document.querySelector("div.listing-chapters_wrap");
        let note = document.createElement("span");
        note.id = "md-note";
        note.style.fontSize = "x-large";
        chapterDiv.insertBefore(note,chapterDiv.firstChild);
    }
    // add download button for each chapter
    function addDownloadButtons(){
        // get all chapters displayed in the table
        let rows = document.querySelectorAll("li.wp-manga-chapter");
        for (let i=0;i<rows.length;i++) {
            let pdfButton = document.createElement("button");
            let zipButton = document.createElement("button");
            pdfButton.textContent = "pdf";
            zipButton.textContent = "zip";
            // disable the button until fetching images links
            pdfButton.disabled = "true";
            zipButton.disabled = "true";
            // store chapter link
            links[i] = rows[i].querySelector("a").href;
            pdfButton.referrerLink = rows[i].querySelector("a").href;
            
            pdfButton.title = rows[i].querySelector("a").textContent.trim();
            zipButton.title = pdfButton.title;
            rows[i].insertBefore(zipButton,rows[i].firstChild);
            rows[i].insertBefore(pdfButton,rows[i].firstChild);
            // storing download button for easy access
            pdfButtons.push(pdfButton);
            zipButtons.push(zipButton);
            {
                let id = i;
                let chapterCount = rows.length
                fetchText(links[id], window.location.href).then((text) => {
                    let waitNote = document.querySelector("span#md-batch-note");
                    let pdfButton = pdfButtons[id];
                    let zipButton = zipButtons[id];
                    // convert text to html DOM
                    let parser = new DOMParser();
                    let doc = parser.parseFromString(text, "text/html");
                    let imgs = doc.querySelectorAll("div.page-break > img.wp-manga-chapter-img");
                    if(host === "manhuaplus.com"){
                        imgs = doc.querySelectorAll("div.reading-content p > img");
                    }
                    pdfButton.imgs = [];
                    zipButton.imgs = [];
                    for(let img of imgs){
                        let src = img.dataset.src !== undefined ? img.dataset.src : img.dataset.lazySrc;
                        src = src === undefined ? img.src : src.trim();
                        pdfButton.imgs.push(src);
                        zipButton.imgs.push(src);
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
        // just to fix the margin
        let chapterList = document.querySelector("ul.main");
        chapterList.style.marginTop = "0px";
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
}
