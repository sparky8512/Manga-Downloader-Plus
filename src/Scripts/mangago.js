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
        buttonHolder.appendChild(pdfButton);
        buttonHolder.appendChild(zipButton);
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

    async function xformImage(url, imageBytes, xform_maps) {
        if (!url.includes("cspiclink")) {
            return imageBytes;
        }

        let map = xform_maps["default"];
        for (const [k, v] of Object.entries(xform_maps)) {
            if (k != "default" && url.includes(k)) {
                map = v;
            }
        }

        if (!map) {
            throw "No map found for image " + url;
        }

        map = map.split("a");
        return xformToJpeg(imageBytes, (image, canvas) => {
            const context = canvas.getContext("2d");
            const w = canvas.width/9;
            const h = canvas.height/9;
            for (let x = 0; x < 9; x++) {
                for (let y = 0; y < 9; y++) {
                    const dxy = map[y*9 + x];
                    const dx = dxy % 9;
                    const dy = (dxy - dx)/9;
                    context.drawImage(image, x * w, y * h, w, h, dx * w, dy * h, w, h);
                }
            }
        });
    }

    function getAltMap(mapIn, swapPositions) {
        let swaps = [];
        let lastPos = 0;
        let mapOut = "";
        for (const pos of swapPositions) {
            swaps.push(+mapIn.charAt(pos));
            mapOut += mapIn.substring(lastPos, pos);
            lastPos = pos + 1;
        }
        mapOut += mapIn.substring(lastPos);

        swaps.reverse();
        for (const swap of swaps) {
            for (let i = (mapOut.length | 1) - 2; i >= swap; i -= 2) {
                mapOut = mapOut.substring(0, i - swap) + mapOut[i] +
                    mapOut.substring(i - swap + 1, i) + mapOut[i - swap] + mapOut.substring(i + 1);
            }
        }

        return mapOut;
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

                let xform_maps = Object.fromEntries(
                    text.matchAll(/_imgkeys_\["([^"]*)"\]="([^"]*)"/g).map((x) => [x[1], x[2]])
                );

                let xform_parts = text.match(/img\.src\.indexOf\("([^"]*)"\)\s*>\s*0\s*\|\|\s*img\.src\.indexOf\("([^"]*)"\)\s*>\s*0\)\s*{\n.*\?\s*"([^"]*)"\s*:\s*"([^"]*)"\s*;.*\n.*\n((?:.*str\.charAt\(\d+\)\s*;.*\n)+)/);
                if (xform_parts) {
                    const swapPositions = Array.from(
                        xform_parts[5].matchAll(/str\.charAt\((\d+)\)/g).map((x) => +x[1])
                    );
                    xform_maps[xform_parts[1]] = getAltMap(xform_parts[3], swapPositions);
                    xform_maps[xform_parts[2]] = getAltMap(xform_parts[4], swapPositions);
                }

                xform_parts = text.match(/var\s+key\s*=\s*"([^"]*)"/);
                if (xform_parts) {
                    xform_maps["default"] = xform_parts[1];
                }

                return { key: parts[1], iv: parts[2], xform: xform_maps };
            });
        }
        let key = fromHex(keyCache[chapterJs].key);
        let iv = fromHex(keyCache[chapterJs].iv);
        let decoded = await decryptAesCbcZeropad(fromBase64(encodedB64), key, iv);
        decoded = new TextDecoder().decode(decoded);
        if (!decoded.toLowerCase().startsWith("http")) {
            throw "Unexpected image list content";
        }
        let urls = decoded.split(",");
        if (decoded.includes("cspiclink")) {
            xform_maps = keyCache[chapterJs].xform;
            if (!xform_maps) {
                throw "Couldn't find image transformation maps";
            }
            urls.xform = (url, imageBytes) => xformImage(url, imageBytes, xform_maps);
        }

        return urls;
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
