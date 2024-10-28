function templateF(funcs, groupNames=null) {
    if (!funcs.isChapterListPage()) {
        return;
    }

    // get all the rows
    let rows;
    // to store download button for easy access
    let pdfButtons = [];
    let zipButtons = [];
    let numButtonGroups = groupNames === null ? 1 : groupNames.length;

    if ("waitChaptersLoaded" in funcs) {
        funcs.waitChaptersLoaded().then((ok) => {
            if (ok) {
                addNote();
                addBatchDownload();
                addDownloadButtons();
                addErrorDialog();
            }
        });
    } else {
        addNote();
        addBatchDownload();
        addDownloadButtons();
        addErrorDialog();
    }

    // add a note for users
    function addNote() {
        let note = document.createElement("span");
        note.id = "md-note";
        note.style.fontSize = "x-large";
        note.style.color = "black";
        funcs.insertNote(note);
    }

    // add download button for each chapter
    function addDownloadButtons() {
        rows = funcs.getChapterElems();
        function loopRows(start) {
            for (let i=start; i<rows.length; i++) {
                if (i >= start+100) {
                    let waitNote = document.querySelector("span#md-batch-note");
                    waitNote.textContent = "wait, "+i+"/"+rows.length+" Chapters.";
                    setTimeout(loopRows, 0, i);
                    break;
                }
                let pdfButtonSet = [];
                let zipButtonSet = [];
                for (let i=0; i<numButtonGroups; i++) {
                    let pdfButton = document.createElement("button");
                    let zipButton = document.createElement("button");
                    pdfButton.textContent = "pdf";
                    zipButton.textContent = "zip";
                    // disable the button until fetching images links
                    pdfButton.disabled = "true";
                    zipButton.disabled = "true";

                    pdfButtonSet.push(pdfButton);
                    zipButtonSet.push(zipButton);
                }

                let res;
                if (groupNames === null) {
                    // no groups set, pass single buttons
                    res = funcs.processChapterElem(rows[i], pdfButtonSet[0], zipButtonSet[0]);
                } else {
                    // groups set, pass arrays of buttons
                    res = funcs.processChapterElem(rows[i], pdfButtonSet, zipButtonSet);
                }

                // store chapter link
                let url = res[0];
                for (let i=0; i<numButtonGroups; i++) {
                    let pdfButton = pdfButtonSet[i];
                    let zipButton = zipButtonSet[i];

                    pdfButton.referrerLink = res[0]

                    pdfButton.title = res[1];
                    zipButton.title = res[1];

                    pdfButton.removeAttribute("disabled");
                    zipButton.removeAttribute("disabled");
                    pdfButton.addEventListener("click", function(){getDownloadImages(pdfButton,zipButton,1,i);});
                    zipButton.addEventListener("click", function(){getDownloadImages(pdfButton,zipButton,2,i);});
                }
                
                // storing download button for easy access
                pdfButtons.push(pdfButtonSet);
                zipButtons.push(zipButtonSet);

                if (pdfButtons.length == rows.length) {
                    addChaptersToList();
                }
            }
        }
        loopRows(0);
    }

    function getDownloadImages(pdfButton, zipButton, type, group) {
        if ("imgs" in pdfButton) {
            embedImages(pdfButton, zipButton, type);
        } else {
            pdfButton.disabled = "true";
            zipButton.disabled = "true";
            let progressReported = false;

            function reportProgress(doneRatio) {
                progressReported = true;
                // changing button text to visualize process
                // the first 50%
                let percentage = doneRatio * 50;
                (type == 1 ? pdfButton : zipButton).textContent = parseInt(percentage)+"%";
            }

            getButtonImages(pdfButton, zipButton, group, reportProgress).then(() => {
                embedImages(pdfButton, zipButton, type, progressReported);
            });
        }
    }

    // lazy fetch of image URL list
    function getButtonImages(pdfButton, zipButton, group, reportProgress) {
        let url = pdfButton.referrerLink;
        return funcs.getChapterImageUrls(url, group, reportProgress).then((imgs) => {
            pdfButton.imgs = imgs;
            zipButton.imgs = imgs;
        }).catch((err) => {
            console.log("Failed to get image URLs from "+url);
            pdfButton.imgs = [];
            zipButton.imgs = [];
            pdfButton.textContent = "Not Found";
            zipButton.style.display = "none";
            pdfButton.disabled = "true";
            zipButton.disabled = "true";
            throw err;
        });
    }

    // add batch download button
    function addBatchDownload(){
        // add the floatDiv to document body
        let floatDiv = document.createElement("div");
        floatDiv.id = "md-floatDiv-download";
        floatDiv.classList.add("md-float-modal", "md-float-modal-download");
        let floatDivContent = document.createElement("div");
        floatDivContent.classList.add("md-float-modal-content", "md-float-modal-download-content");
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

        async function getBatchImages(pdfButtonBatch, zipButtonBatch, options, progressBar, group) {
            function setOptionFromButton(option, pdfButton) {
                if (pdfButton.imgs.length === 0) {
                    option.selected = false;
                    option.disabled = true;
                    option.textContent += " FAILED";
                } else {
                    option.imgs = pdfButton.imgs;
                }
            }

            let needImgs = [];
            for (let option of options) {
                if ("imgs" in options) {
                    continue;
                }

                let pdfButton = pdfButtons[option.index][group];
                if ("imgs" in pdfButton) {
                    setOptionFromButton(option, pdfButton);
                } else {
                    needImgs.push(option);
                }
            }

            if (needImgs.length > 0) {
                pdfButtonBatch.disabled = "true";
                zipButtonBatch.disabled = "true";
                progressBar.style.display = "block";
                progressBar.style.width = "0%";
                progressBar.textContent = "Preparing 0%";
                let optionCount = needImgs.length;
                let totalDone = 0;

                function optionImages(option) {
                    let optionDone = 0;

                    function reportProgress(doneRatio) {
                        let newlyDone = doneRatio - optionDone;
                        if (newlyDone != 0) {
                            optionDone = doneRatio;
                            totalDone += newlyDone;

                            let progress = (totalDone * 100 / optionCount).toFixed(2)+"%";
                            progressBar.style.width = progress;
                            progressBar.textContent = "Preparing "+progress;
                        }
                    }

                    let pdfButton = pdfButtons[option.index][group];
                    let zipButton = zipButtons[option.index][group];
                    return getButtonImages(pdfButton, zipButton, group, reportProgress).finally(() => {
                        setOptionFromButton(option, pdfButton);
                        reportProgress(1);
                    });
                }

                await runAsyncTaskQueue(optionImages, needImgs, 10);

                pdfButtonBatch.removeAttribute("disabled");
                zipButtonBatch.removeAttribute("disabled");
                progressBar.style.display = "none";
                progressBar.style.width = "0%";
                progressBar.textContent = "0%";
            }
        }

        let buttonHolder = document.createElement("span");

        for (let i=0; i<numButtonGroups; i++) {
            let pdfButtonBatch = document.createElement("button");
            pdfButtonBatch.classList.add("md-download-button");
            let zipButtonBatch = document.createElement("button");
            zipButtonBatch.classList.add("md-download-button");
            if (groupNames === null) {
                pdfButtonBatch.textContent = "Download Selected Chapter/s as PDF files";
                zipButtonBatch.textContent = "Download Selected Chapter/s as ZIP files";
            } else {
                pdfButtonBatch.textContent = "Download Selected from "+groupNames[i]+" as PDF files";
                zipButtonBatch.textContent = "Download Selected from "+groupNames[i]+" as ZIP files";
            }

            buttonHolder.appendChild(pdfButtonBatch);
            buttonHolder.appendChild(zipButtonBatch);
            if (i+1 < numButtonGroups) {
                let br = document.createElement("br");
                buttonHolder.appendChild(br);
            }

            pdfButtonBatch.addEventListener("click", async function() {
                await getBatchImages(pdfButtonBatch, zipButtonBatch, floatDivChapterList.selectedOptions, batchProgressBar, i);
                if (floatDivChapterList.selectedOptions.length > 0) {
                    batchEmbedImages(pdfButtonBatch, zipButtonBatch, 1, floatDivChapterList, batchProgressBar);
                }
            });

            zipButtonBatch.addEventListener("click", async function() {
                await getBatchImages(pdfButtonBatch, zipButtonBatch, floatDivChapterList.selectedOptions, batchProgressBar, i);
                if (floatDivChapterList.selectedOptions.length > 0) {
                    batchEmbedImages(pdfButtonBatch, zipButtonBatch, 2, floatDivChapterList, batchProgressBar);
                }
            });
        }

        floatDivContent.appendChild(buttonHolder);

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
        let floatDivChapterList = document.querySelector("select#md-float-chapter-list");

        for (let i=0; i<pdfButtons.length; i++) {
            let option = document.createElement("option");
            let pdfButton = pdfButtons[i][0];
            option.textContent = pdfButton.title;
            option.value = pdfButton.title;
            option.ref = pdfButton.referrerLink;
            floatDivChapterList.appendChild(option);
        }

        waitNote.textContent = "Its Ready.";
        waitNote.style.display = "none";
        
        let batchDownloadButton = document.querySelector("button#md-batch-download-button");
        batchDownloadButton.onclick = function(){
            let floatDiv = document.querySelector("div#md-floatDiv-download");
            floatDiv.style.display = "block";
        };
        batchDownloadButton.removeAttribute("disabled");
    }

    // add permissions error dialog
    function addErrorDialog() {
        let floatDiv = document.createElement("div");
        floatDiv.id = "md-floatDiv-error";
        floatDiv.classList.add("md-float-modal", "md-float-modal-error");
        document.body.appendChild(floatDiv);

        let floatDivContent = document.createElement("div");
        floatDivContent.classList.add("md-float-modal-content", "md-float-modal-error-content");
        floatDiv.appendChild(floatDivContent);

        let floatCloseButton = document.createElement("span");
        floatCloseButton.classList.add("md-float-close");
        floatCloseButton.innerHTML = "&times;";
        floatDivContent.appendChild(floatCloseButton);

        let errorMessage = document.createElement("p");
        errorMessage.id = "md-error-message";
        floatDivContent.appendChild(errorMessage);

        let buttonHolder = document.createElement("span");
        let optionsButton = document.createElement("button");
        optionsButton.id = "md-options-button";
        optionsButton.classList.add("md-download-button", "md-error-button");
        optionsButton.textContent = "Open Options Page";
        buttonHolder.appendChild(optionsButton);
        let retryButton = document.createElement("button");
        retryButton.id = "md-retry-button";
        retryButton.classList.add("md-download-button", "md-error-button");
        retryButton.textContent = "Retry Download";
        buttonHolder.appendChild(retryButton);
        floatDivContent.appendChild(buttonHolder);
    }
}
