function mangagoF() {
    let templateFuncs = {};

    templateFuncs.isChapterListPage = function() {
        return document.querySelector("table#chapter_table") !== null;
    };

    templateFuncs.getChapterElems = function() {
        // this is just a convenient place to do this
        let floatChapterList = document.getElementById("md-float-chapter-list");
        floatChapterList.style.height = "revert";
        floatChapterList.style["font-size"] = "revert";
        floatChapterList.style.float = "revert";

        return document.querySelectorAll("table#chapter_table > tbody > tr > td:nth-child(1) a");
    };

    templateFuncs.insertNote = function(note) {
        let chapterDiv = document.querySelector("table#chapter_table");
        chapterDiv.parentElement.insertBefore(note, chapterDiv);
    };

    templateFuncs.processChapterElem = function(elem, pdfButton, zipButton) {
        let link = elem.href;
        let title = elem.textContent.trim();

        let buttonHolder = document.createElement("td");
        buttonHolder.style["padding-left"] = "1ch";
        buttonHolder.appendChild(pdfButton, elem);
        buttonHolder.appendChild(zipButton, elem);
        elem.parentElement.parentElement.parentElement.appendChild(buttonHolder);

        return [link, title];
    };

    let keyCache = {};

    // these are a little too new in Uint8Array to rely on having across all browsers
    function fromBase64(str) {
        return Uint8Array.from(atob(str), (x) => x.charCodeAt(0));
    }
    function fromHex(str) {
        return new Uint8Array(str.match(/../g).map((x) => parseInt(x, 16)));
    }

    // SubtleCrypto AES CBC algo uses PKCS#7 padding, so monkey up
    // zeropadding support by appending an encrypted PKCS#7 padding
    // block, decrypting that, then manually removing the zeropadding
    async function decryptAesCbcZeropad(data, rawKey, iv) {
        let key = await crypto.subtle.importKey("raw", rawKey, { name: "AES-CBC" }, false, ["encrypt", "decrypt"]);
        let padIv = new Uint8Array(data.buffer, data.length-16);
        let padBlock = await crypto.subtle.encrypt({ name: "AES-CBC", iv: padIv }, key, new Uint8Array());
        let dataPadded = new Uint8Array(data.length + 16);
        dataPadded.set(data);
        dataPadded.set(new Uint8Array(padBlock), data.length)
        let decoded = await crypto.subtle.decrypt({ name: "AES-CBC", iv: iv }, key, dataPadded);
        decoded = new Uint8Array(decoded);
        let unpaddedLen = decoded.length;
        while (unpaddedLen >= decoded.length-15 && !decoded.at(unpaddedLen-1)) {
            unpaddedLen--;
        }
        return new Uint8Array(decoded.buffer, 0, unpaddedLen);
    }

    async function decodeImageList(encodedB64, chapterJs, chapterUrl) {
        if (!(chapterJs in keyCache)) {
            keyCache[chapterJs] = await fetchText(chapterJs, chapterUrl).then((text) => {
                // deSoJsonV4 it:
                let parts = text.match(/\['sojson.v4'\].*\(null,"([^"]*)"/);
                if (!parts) {
                    throw "Could not parse chapter.js";
                }
                text = String.fromCharCode.apply(null, parts[1].split(/[a-zA-Z]{1,}/));

                parts = text.match(/typeof\(imgsrcs\).*?\svar\s+key\s*=\s*CryptoJS.enc.Hex.parse\("([^"]*)"\).*?\svar\s+iv\s*=\s*CryptoJS.enc.Hex.parse\("([^"]*)"\)/s);
                if (!parts) {
                    throw "Could not parse deobfuscated chapter.js";
                }
                return { key: parts[1], iv: parts[2] };
            });
        }
        let key = fromHex(keyCache[chapterJs].key);
        let iv = fromHex(keyCache[chapterJs].iv);
        let decoded = await decryptAesCbcZeropad(fromBase64(encodedB64), key, iv);
        decoded = new TextDecoder().decode(decoded);
        if (!decoded.toLowerCase().startsWith("http")) {
            throw "Unexpected image list content";
        }
        if (decoded.includes("cspiclink")) {
            throw "Scrambled images not supported";
        }
        return decoded.split(",");
    }

    templateFuncs.getChapterImageUrls = function(chapterUrl, buttonGroup, reportProgress) {
        return fetchText(chapterUrl, window.location.href).then((text) => {
            // convert text to html DOM
            let parser = new DOMParser();
            let doc = parser.parseFromString(text, "text/html");
            let imgsrcs;
            let chapterJs;
            let scripts = doc.querySelectorAll("script");
            for (let script of scripts) {
                if (!imgsrcs) {
                    let parts = script.innerText.match(/var\s+imgsrcs\s*=\s*'([^']*)'/);
                    if (parts !== null) {
                        imgsrcs = parts[1];
                    }
                }
                if (!chapterJs && script.src.includes("/chapter.js")) {
                    chapterJs = script.src;
                }
                if (imgsrcs && chapterJs) {
                    return decodeImageList(imgsrcs, chapterJs, chapterUrl);
                }
            }
            throw "Image list not found";
        });
    };

    templateF(templateFuncs);
}
