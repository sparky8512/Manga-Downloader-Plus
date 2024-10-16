function mangatownF() {
    // to store number of pages for each chapter
    let pages = [];
    // to store links of each chapter
    let links = [];
    // get all the rows
    let rows;
    // to store download button for easy access
    let pdfButtons = [];
    let zipButtons = [];
    // check if viewing chapters list page
    if(document.querySelector("div.chapter_content ul.chapter_list") !== null){
        rows = document.querySelectorAll("ul.chapter_list > li");
        // calling function
        addNote();
        addDownloadButtons();
    }
    // add a note for users
    function addNote(){
        let chapterDiv = document.querySelector("div.chapter_content");
        let note = document.createElement("span");
        note.style.fontSize = "x-large";
        note.style.color = "black";
        chapterDiv.insertBefore(note,chapterDiv.firstChild);
    }
    // add download button for each chapter
    function addDownloadButtons(){
        // i for rows and index is for arrays
        // i start from 1 because 0 is for header
        for (let i = 0; i < rows.length; i++) {
            let pdfButton = document.createElement("button");
            let zipButton = document.createElement("button");
            pdfButton.textContent = "pdf";
            zipButton.textContent = "zip";
            // disable the button until fetching chapter pages number
            pdfButton.disabled = "true";
            zipButton.disabled = "true";
            // store chapter link
            links[i] = rows[i].querySelector("a").href;
            pdfButton.referrerLink = rows[i].querySelector("a").href;
            // add chapter number and name to button title and trimming extra spaces
            let title = rows[i].querySelector("a").textContent.trim();
            pdfButton.title = title;
            zipButton.title = title;

            rows[i].insertBefore(zipButton,rows[i].firstChild);
            rows[i].insertBefore(pdfButton,rows[i].firstChild);
            // storing download button for easy access
            pdfButtons.push(pdfButton);
            zipButtons.push(zipButton);
            // to fetch pages number from chapter link
            let xhttp = new XMLHttpRequest();
            // added id to each xhttp request to know what button called it					
            xhttp.id = i;
            xhttp.onreadystatechange = function () {
                let id = this.id;
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

                    pdfButton.imgs = [];
                    zipButton.imgs = [];
                    let imgs = doc.querySelectorAll("div.read_img img.image");
                    if(imgs.length > 0){
                        pages[id] = null;

                        for(let img of imgs){
                            pdfButton.imgs.push(img.src);
                            zipButton.imgs.push(img.src);
                        }
                    }
                    else{
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
                            console.log("Couldn't find page count");
                            return;
                        }
                        let str = script.slice(script.indexOf("total_pages"), script.length);
                        str = str.slice(str.indexOf("=")+1, str.indexOf(";"));
                        let pagesNum = parseInt(str.trim());
                        // storing pages number
                        pages[id] = pagesNum;

                        // save off first image URL, since we already have it
                        let img = doc.querySelector("div.read_img img#image");
                        pdfButton.imgs[0] = img.src;
                        zipButton.imgs[0] = img.src;
                    }

                    // making button clickable and adding listener for click
                    pdfButton.removeAttribute("disabled");
                    zipButton.removeAttribute("disabled");
                    pdfButton.addEventListener("click", function(){getImgs(id,1);});
                    zipButton.addEventListener("click", function(){getImgs(id,2);});
                }
            };
            xhttp.onerror = function (){
                console.log("Failed to get "+links[i]);
            };
            xhttp.open("GET", links[i], true);
            xhttp.send();
        }
    }
    // get all images links
    function getImgs(id,type){
        // check if currently downloading
        if(pdfButtons[id].down){
            pdfButtons[id].disabled = "true";
            zipButtons[id].disabled = "true";
            return;
        }
        pdfButtons[id].down = true;
        zipButtons[id].down = true;
        let button;
        if(type === 1){
            button = pdfButtons[id];
        }
        if(type === 2){
            button = zipButtons[id];
        }
        // check if the user already downloaded this chapter
        if(type === 1 && pdfButtons[id].pdf){
            downloadFile(pdfButtons[id].pdf,button.title.trim(),"zip");
            return;
        }
        if(type === 2 && zipButtons[id].zip){
            downloadFile(zipButtons[id].zip,button.title.trim(),"zip");
            return;
        }
        pdfButtons[id].disabled = "true";
        zipButtons[id].disabled = "true";
        if(pages[id] === null) {
            // already have images
            button.textContent = "50%";
            embedImages(pdfButtons[id],zipButtons[id],type,true);
        }
        else{
            button.textContent = "0%";
            // to know when all links are found
            pdfButtons[id].counter = 1;
            // loop through chapter pages, starting with second page
            let index = 1;
            for(let i=2;i<=pages[id];i++){
                let xhttp = new XMLHttpRequest();
                xhttp.id = id;
                xhttp.num = index;
                xhttp.type = type;
                xhttp.onreadystatechange = function (){
                    let id = this.id;
                    let num = this.num;
                    let type = this.type;
                    let pdfButton = pdfButtons[id];
                    let zipButton = zipButtons[id];
                    // if the request succeed
                    if(this.readyState === 4 & this.status === 200){
                        let parser = new DOMParser();
                        let doc = parser.parseFromString(this.responseText, "text/html");
                        let img = doc.querySelector("div.read_img img#image");
                        // storing img link in button for easy access
                        pdfButton.imgs[num] = img.src;
                        zipButton.imgs[num] = img.src;
                        pdfButtons[id].counter++;
                        // changing button text to visualize process
                        // the first 50%
                        let percentage = (pdfButtons[id].counter * 50)/pages[id];
                        button.textContent = parseInt(percentage)+"%";
                        // if all links are found make pdf/zip file
                        if(pdfButtons[id].counter === pages[id]){
                            embedImages(pdfButton,zipButton,type,true);
                        }
                    }
                };
                xhttp.onerror = function (){
                    console.log("Failed to get "+links[id]+"/"+i+".html");
                };
                // i because webpages starts from /1
                let chapUrl = links[id];
                if(!chapUrl.endsWith("/")){
                    chapUrl += "/";
                }
                xhttp.open("GET", chapUrl+i+".html");
                xhttp.send();
                index++;
            }
        }
    }
}
