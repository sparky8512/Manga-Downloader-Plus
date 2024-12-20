const { PDFDocument } = PDFLib;

if (typeof browser == "undefined") {
    globalThis.browser = chrome;
}

// check image arrayBuffer if it's a Jpeg
function isJPEG(arrayBuffer){
    let data = new Uint8Array(arrayBuffer);
    if (data.length < 2) {
        return false;
    }
    let jpgMgck = [0xff, 0xd8];
    if(data[0] === jpgMgck[0] && data[1] === jpgMgck[1]){
        return true;
    }

    return false;
}
// check image arrayBuffer if it's a Png
function isPNG(arrayBuffer){
    let data = new Uint8Array(arrayBuffer);
    if (data.length < 2) {
        return false;
    }
    let pngMgck = [0x89, 0x50];
    if(data[0] === pngMgck[0] && data[1] === pngMgck[1]){
        return true;
    }

    return false;
}
// convert image from arrayBuffer to jpeg as base64
function imageToJpeg(arrayBuffer){
    return new Promise((resolve, reject) => {
        let arrayBufferView = new Uint8Array(arrayBuffer);
        let blob = new Blob( [ arrayBufferView ], { type: "image/jpeg" } );
        let urlCreator = window.URL || window.webkitURL;
        let imageUrl = urlCreator.createObjectURL(blob);

        let image = new Image();
        image.addEventListener("load", () => {
            let canvas = document.createElement("canvas");
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            canvas.getContext("2d").drawImage(image, 0, 0);
            let data = canvas.toDataURL("image/jpeg").split(";base64,")[1];
            resolve(data);
        });
        image.addEventListener("error", () => {
            reject("conversion error");
        });
        image.src = imageUrl;
    });
}
// Function wrapping code.
// fn - reference to function.
// context - what you want "this" to be.
// params - array of parameters to pass to function.
function wrapFunction(fn, context, params) {
    return function() {
        fn.apply(context, params);
    };
}
async function handleFetchError(err, hostname) {
    const errorMessage = document.getElementById("md-error-message");
    if (errorMessage === null) {
        return false;
    }

    if (err === "PERMISSION_FAILURE") {
        errorMessage.textContent = "There was an error downloading a file due to " +
            "missing permission to access the website \"" + hostname + "\". Permission " +
            "for that can be added manually in the Manga Downloader+ options page.";
    } else if (err === "PERMISSION_OK") {
        errorMessage.textContent = "There was an error downloading a file. If the " +
            "download request was a redirected, this may be due to missing permission " +
            "to access the redirect target website. Permission for that can be added " +
            "manually in the Manga Downloader+ options page; however, the redirect " +
            "target cannot be determeined automatically.";
    } else {
        return false;
    }

    return new Promise((resolve, reject) => {
        const errorDialog = document.getElementById("md-floatDiv-error");
        errorDialog.style.display = "block";
        const optionsButton = document.getElementById("md-options-button");
        const retryButton = document.getElementById("md-retry-button");
        const closeButton = errorDialog.querySelector("span.md-float-close");

        function handleOptions(event) {
            browser.runtime.sendMessage({cmd: "openOptions"});
        }

        function handleRetry(event) {
            done(true);
        }

        function handleClose(event) {
            done(false);
        }

        function done(result) {
            optionsButton.removeEventListener("click", handleOptions);
            retryButton.removeEventListener("click", handleRetry);
            closeButton.removeEventListener("click", handleClose);
            errorDialog.style.display = "none";
            resolve(result);
        }

        optionsButton.addEventListener("click", handleOptions);
        retryButton.addEventListener("click", handleRetry);
        closeButton.addEventListener("click", handleClose);
    });
}
// Run a fetch() through the background task if cross-origin
async function fetchText(url, ref) {
    if ((new URL(url)).origin == window.location.origin && (new URL(ref)).origin == window.location.origin) {
        return fetch(url, {referrer: ref, referrerPolicy: "no-referrer-when-downgrade", credentials: "include"}).then((res) => res.text());
    }
    const res = await browser.runtime.sendMessage({cmd: "fetchText", url: url, referrer: ref});
    if (res[0]) {
        return res[1];
    }
    const retry = await handleFetchError(res[1], new URL(url).hostname);
    if (retry) {
        return fetchText(url, ref);
    }
    throw res[1];
}
async function fetchImage(url, ref) {
    if ((new URL(url)).origin == window.location.origin && (new URL(ref)).origin == window.location.origin) {
        return fetch(url, {referrer: ref, referrerPolicy: "no-referrer-when-downgrade", credentials: "include"})
            .then((res) => res.arrayBuffer()).then((buf) => {
                // JSZip will fail if this instanceof check returns false, which
                // will happen for window.ArrayBuffer objects on Firefox
                if (buf instanceof ArrayBuffer) {
                    return buf;
                }
                return structuredClone(buf, {tranfser: [buf]});
            });
    }
    const res = await browser.runtime.sendMessage({cmd: "fetchImage", url: url, referrer: ref});
    if (res[0]) {
        return (new Uint8Array(res[1])).buffer;
    }
    const retry = await handleFetchError(res[1], new URL(url).hostname);
    if (retry) {
        return fetchImage(url, ref);
    }
    throw res[1];
}
// make pdf/zip from images stored in a button
async function embedImages(pdfButton,zipButton,type,half=false){
    // check if currently downloading
    if(!half && pdfButton.down){
        pdfButton.disabled = "true";
        zipButton.disabled = "true";
        return;
    }
    pdfButton.down = true;
    zipButton.down = true;
    // check if the user already downloaded this chapter
    if(type === 1 && pdfButton.pdf){
        downloadFile(pdfButton.pdf,pdfButton.title.trim(),"pdf");
        downloadFinished(pdfButton,zipButton);
        return;
    }
    if(type === 2 && zipButton.zip){
        downloadFile(zipButton.zip,zipButton.title.trim(),"zip");
        downloadFinished(pdfButton,zipButton);
        return;
    }
    pdfButton.disabled = "true";
    zipButton.disabled = "true";
    let button;
    if(type === 1){
        button = pdfButton;
    }
    if(type === 2){
        button = zipButton;
    }
    let pagesNum = button.imgs.length;
    // check if button has images
    if(pagesNum === 0 ){
        button.textContent = "no Images";
        alert("check if ("+button.title.trim()+") has images.\n"
                +"-if there are images.(reload this page)\n"
                +"-if no images.(image are not include them)");
        downloadFinished(pdfButton,zipButton);
        return;
    }
    // Create a new PDFDocument
    let pdfDoc = await PDFDocument.create();
    // Create new zip file
    let zip = new JSZip();
    // work around JSZip bug #369
    let now = new Date();
    now.setTime(now.getTime() - now.getTimezoneOffset() * 60000);
    JSZip.defaults.date = now;
    // create a folder inside the zip file
    let folder = zip.folder(button.title.trim());
    let percentage = "";
    // get referrer link to bypass anti hot-linking
    let referrerLink = pdfButton.referrerLink;
    for(let i=1;i<=pagesNum;i++){
        // changing button text to visualize process
        if(half === true){
            percentage = ((i * 50)/pagesNum)+50;
            button.textContent = parseInt(percentage)+"%";
        }
        else{
            percentage = ((i * 100)/pagesNum);
            button.textContent = parseInt(percentage)+"%";
        }
        //get image url from links stored in button
        let imgUrl = button.imgs[i-1].trim();
        imgUrl = imgUrl.replace("http://","https://");
        // Fetch image arrayBuffer
        let imageBytes;
        try {
            imageBytes = await fetchImage(imgUrl, referrerLink);
        } catch {
            alert("(Manga Downloader) Can't fetch image.\n"+imgUrl);
            downloadFinished(pdfButton,zipButton);
            return;
        }
        // find image type, if not a jpeg or png convert it
        let imageType = ".jpg";
        if(isJPEG(imageBytes)){
            imageType = ".jpg";
        }
        else if(isPNG(imageBytes)){
            imageType = ".png";
        }
        else{
            // the image is not jpg or png
            // convert image to jpg
            try {
                imageBytes = await imageToJpeg(imageBytes);
            } catch (error) {
                alert("(Manga Downloader) Couldn't convert Image.\n"+imgUrl);
                downloadFinished(pdfButton,zipButton);
                return;
            }
        }
        // add image to folder with leading zeros
        let size = pagesNum.toString().length;
        let num = i.toString();
        while (num.length < (size || 2)) {
            num = "0" + num;
        }
        now = new Date();
        now.setTime(now.getTime() - now.getTimezoneOffset() * 60000);
        folder.file(num + imageType, imageBytes, {base64: true, date: now});
        // Embed the image bytes
        let image;
        try {
            image = await pdfDoc.embedJpg(imageBytes);
        } catch (error) {
            try {
                image = await pdfDoc.embedPng(imageBytes);
            } catch (error) {
                alert("Try this:\n"
                        +"\t-Try to reload the page.\n"
                        +"\t-check if all images loads (some images url can be broken)\n"
                        +"\t-load the chapter in new tab (wait for the images to load).\n"
                        +"\t-try change the server(if exist)\n"
                        +"(Manga Downloader)");
                        downloadFinished(pdfButton,zipButton);
                return;
            }
        }
        // Add a blank page to the document
        let page = pdfDoc.addPage();
        page.setWidth(image.width);
        page.setHeight(image.height);
        // Draw the image
        page.drawImage(image);
    }
    // Serialize the PDFDocument to bytes (a Uint8Array)
    let pdfBytes = await pdfDoc.save();
    // store pdf in button for reDownload
    pdfButton.pdf = pdfBytes;
    if(type === 1){
        // Trigger the browser to download the PDF document
        downloadFile(pdfBytes,button.title.trim(),"pdf");
    }
    // generate zip folder to download
    zip.generateAsync({type:"blob"}).then(function(content) {
        // store zip in button for reDownload
        zipButton.zip = content;
        if(type === 2){
            downloadFile(content,button.title.trim(),"zip");
        }
    }, function(error) {
        // probably not very useful, but better than silence:
        alert("Internal error making ZIP file: "+error);
    });
    // enable the button after process is finished
    downloadFinished(pdfButton,zipButton);
}

async function batchEmbedImages(pdfButtonBatch,zipButtonBatch,type,chapterList,progressBar){
    pdfButtonBatch.disabled = "true";
    zipButtonBatch.disabled = "true";
    chapterList.disabled = "true";
    progressBar.style.display = "block";
    progressBar.style.width = "0%";
    progressBar.textContent = "0%";
    progressBar.failedChapters = [];
    // check if user currently downloading 
    if(pdfButtonBatch.down){
        return;
    }
    pdfButtonBatch.down = true;
    zipButtonBatch.down = true;
    // array to hold function to run them as a queue
    let funQueue = [];
    let selectedChapters = chapterList.selectedOptions;
    // get all chapters images count
    let imageCount = 0;
    for(let k=0;k < selectedChapters.length;k++){
        imageCount += selectedChapters[k].imgs.length;
    }
    progressBar.imageCount = imageCount;
    progressBar.currentImageNum = 0;
    
    for(let j=selectedChapters.length-1 ;j>=0;j--){
        let chapter = selectedChapters[j];
        let fun;
        // get referrer link to bypass anti hot-linking
        let referrerLink = chapter.ref;
        if(type === 1){
            fun = wrapFunction(createPdf, this, [pdfButtonBatch,zipButtonBatch,chapterList,chapter,referrerLink,progressBar,funQueue]);
        }
        else if(type === 2){
            fun = wrapFunction(createZip, this, [pdfButtonBatch,zipButtonBatch,chapterList,chapter,referrerLink,progressBar,funQueue]);
        }
        funQueue.push(fun);
    }
    // execute functions
    let count = 0;
    while (funQueue.length > 0 && count < 5) {
        (funQueue.shift())();
        count++;  
    }
}

async function createPdf(pdfButtonBatch,zipButtonBatch,chapterList,chapter,referrerLink,progressBar,funQueue){
    // Create a new PDFDocument
    let pdfDoc = await PDFDocument.create();
    let percentage;
    let errorHappened = false;
    let i;
    for(i=1;i<=chapter.imgs.length;i++){
        // increase percentage for each image
        progressBar.currentImageNum++;
        percentage = ((progressBar.currentImageNum * 100)/progressBar.imageCount);
        progressBar.style.width = percentage.toFixed(2)+"%";
        progressBar.textContent = percentage.toFixed(2)+"%";
        //get image url from links stored in button
        let imgUrl = chapter.imgs[i-1].trim();
        imgUrl = imgUrl.replace("http://","https://");
        // Fetch image arrayBuffer
        let imageBytes;
        try {
            imageBytes = await fetchImage(imgUrl, referrerLink);
        } catch {
            progressBar.failedChapters.push(chapter.value.trim());
            errorHappened = true;
            break;
        }
        //check image type
        if(isJPEG(imageBytes)){
            //imageType = ".jpg";
        }
        else if(isPNG(imageBytes)){
            //imageType = ".png";
        }
        else{
            // the image is not jpg or png
            // convert image to jpg
            try {
                imageBytes = await imageToJpeg(imageBytes);
            } catch (error) {
                progressBar.failedChapters.push(chapter.value.trim());
                errorHappened = true;
                break;
            }
        }
        // Embed the image bytes
        let image;
        try {
            image = await pdfDoc.embedJpg(imageBytes);
        } catch (error) {
            try {
                image = await pdfDoc.embedPng(imageBytes);
            } catch (error) {
                progressBar.failedChapters.push(chapter.value.trim());
                errorHappened = true;
                break;
            }
        }
        // Add a blank page to the document
        let page = pdfDoc.addPage();
        page.setWidth(image.width);
        page.setHeight(image.height);
        // Draw the image
        page.drawImage(image);
    }
    // show the user what chapter didn't download
    if(errorHappened){
        progressBar.currentImageNum += chapter.imgs.length - i;
        if(progressBar.currentImageNum === progressBar.imageCount){
            batchDownloadFinished(pdfButtonBatch,zipButtonBatch,chapterList,progressBar);
            if(progressBar.failedChapters.length > 0){
                let str = "";
                for(let i=0;i<progressBar.failedChapters.length;i++){
                    str += progressBar.failedChapters[i] + "\n";
                }
                alert("(Manga Downloader) Couldn't download chapter/s:\n"+str);
            }
        }
        return;
    }
    // call next function in queue
    if(funQueue.length > 0){
        (funQueue.shift())();
    }
    // Serialize the PDFDocument to bytes (a Uint8Array)
    let pdfBytes = await pdfDoc.save();
    // Trigger the browser to download the PDF document
    downloadFile(pdfBytes,chapter.value.trim(),"pdf");
    // enable the button after process is finished
    if(progressBar.currentImageNum === progressBar.imageCount){
        batchDownloadFinished(pdfButtonBatch,zipButtonBatch,chapterList,progressBar);
        if(progressBar.failedChapters.length > 0){
            let str = "";
            for(let i=0;i<progressBar.failedChapters.length;i++){
                str += progressBar.failedChapters[i] + "\n";
            }
            alert("(Manga Downloader) Couldn't download chapter/s:\n"+str);
        }
    }
}

async function createZip(pdfButtonBatch,zipButtonBatch,chapterList,chapter,referrerLink,progressBar,funQueue){
    // Create new zip file
    let zip = new JSZip();
    // work around JSZip bug #369
    let now = new Date();
    now.setTime(now.getTime() - now.getTimezoneOffset() * 60000);
    JSZip.defaults.date = now;
    // create a folder inside the zip file
    let folder = zip.folder(chapter.value.trim());
    let percentage;
    let errorHappened = false;
    let i;
    for(i=1;i<=chapter.imgs.length;i++){
        // increase percentage for each image
        progressBar.currentImageNum++;
        percentage = ((progressBar.currentImageNum * 100)/progressBar.imageCount);
        progressBar.style.width = percentage.toFixed(2)+"%";
        progressBar.textContent = percentage.toFixed(2)+"%";
        //get image url from links stored in button
        let imgUrl = chapter.imgs[i-1].trim();
        imgUrl = imgUrl.replace("http://","https://");
        // Fetch image arrayBuffer
        let imageBytes;
        try {
            imageBytes = await fetchImage(imgUrl, referrerLink);
        } catch {
            progressBar.failedChapters.push(chapter.value.trim());
            errorHappened = true;
            break;
        }
        // check image type
        let imageType = ".jpg";
        if(isJPEG(imageBytes)){
            imageType = ".jpg";
        }
        else if(isPNG(imageBytes)){
            imageType = ".png";
        }
        else{
            // the image is not jpg or png
            // convert image to jpg
            try {
                imageBytes = await imageToJpeg(imageBytes);
            } catch (error) {
                progressBar.failedChapters.push(chapter.value.trim());
                errorHappened = true;
                break;
            }
        }
        // add image to folder with leading zeros
        let size = chapter.imgs.length.toString().length;
        let num = i.toString();
        while (num.length < (size || 2)) {
            num = "0" + num;
        }
        now = new Date();
        now.setTime(now.getTime() - now.getTimezoneOffset() * 60000);
        folder.file(num + imageType, imageBytes, {base64: true, date: now});
    }
    if(errorHappened){
        progressBar.currentImageNum += chapter.imgs.length - i;
        if(progressBar.currentImageNum === progressBar.imageCount){
            batchDownloadFinished(pdfButtonBatch,zipButtonBatch,chapterList,progressBar);
            if(progressBar.failedChapters.length > 0){
                let str = "";
                for(let i=0;i<progressBar.failedChapters.length;i++){
                    str += progressBar.failedChapters[i] + "\n";
                }
                alert("(Manga Downloader) Couldn't download chapter/s:\n"+str);
            }
        }
        return;
    }
    // call next function in queue
    if(funQueue.length > 0){
        (funQueue.shift())();
    }
    // generate zip folder to download
    await zip.generateAsync({type:"blob"}).then(function(content) {
        // store zip in button for reDownload
        downloadFile(content,chapter.value.trim(),"zip");
    });
    // enable the button after process is finished
    if(progressBar.currentImageNum === progressBar.imageCount){
        batchDownloadFinished(pdfButtonBatch,zipButtonBatch,chapterList,progressBar);
        if(progressBar.failedChapters.length > 0){
            let str = "";
            for(let i=0;i<progressBar.failedChapters.length;i++){
                str += progressBar.failedChapters[i] + "\n";
            }
            alert("(Manga Downloader) Couldn't download chapter/s:\n"+str);
        }
    }
}
// download arraybuffer as file
function downloadFile(body, filename, extension) {
    const blob = new Blob([body]);
    const fileName = `${filename}.${extension}`;
    if (navigator.msSaveBlob) {
      // IE 10+
      navigator.msSaveBlob(blob, fileName);
    } else {
      const link = document.createElement('a');
      // Browsers that support HTML5 download attribute
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
}

function downloadFinished(pdfButton,zipButton){
    zipButton.removeAttribute("disabled");
    zipButton.textContent = "zip";
    pdfButton.removeAttribute("disabled");
    pdfButton.textContent = "pdf";
    pdfButton.down = false;
    zipButton.down = false;
}

function batchDownloadFinished(pdfButtonBatch,zipButtonBatch,chapterList,progressBar){
    pdfButtonBatch.removeAttribute("disabled");
    zipButtonBatch.removeAttribute("disabled");
    chapterList.removeAttribute("disabled");
    progressBar.style.display = "none";
    progressBar.style.width = "0%";
    progressBar.textContent = "0%";
    pdfButtonBatch.down = false;
    zipButtonBatch.down = false;
}

// run async operations in parallel
function runAsyncTaskQueue(func, argQueue, maxParallel) {
    return new Promise((resolve, reject) => {
        let queuedCount = 0;

        function queueNext() {
            if (argQueue.length > 0) {
                func(argQueue.shift()).finally(queueNext);
            } else {
                queuedCount--;
                if (queuedCount == 0) {
                    resolve();
                }
            }
        }

        while (argQueue.length > 0 && queuedCount < maxParallel) {
            queuedCount++;
            func(argQueue.shift()).finally(queueNext);
        }
    });
}
