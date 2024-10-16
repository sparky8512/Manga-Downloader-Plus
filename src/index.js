var host = window.location.host;

if(document.querySelector("span#azerty") === null){
    // to make code run only once 
    var mark = document.createElement("span");
    mark.id = "azerty";
    mark.style.display = "none";
    document.body.appendChild(mark);

    // tell the browser to use HTTPS rather than HTTP.
    let upgradeInsecure = document.createElement("meta");
    upgradeInsecure.httpEquiv = "Content-Security-Policy";
    upgradeInsecure.content = "upgrade-insecure-requests";
    document.head.insertBefore(upgradeInsecure,document.head.firstElementChild);

    switch (host) {
        case "mangakiss.org":
        case "mangakomi.com":
        case "toonily.com":
        case "mangatx.to":
        case "manhuaplus.com":
        case "toonclash.com":
            mangakissF();
            break;
        case "manhuaus.com":
            manhuausF();
            break;
        case "mangakakalot.com":
            mangakakalotF();
            break;
        case "m.manganelo.com":
        case "chapmanganelo.com":
        case "manganato.com":
        case "chapmanganato.to":
            manganeloF();
            break;
        case "ww5.readhaikyuu.com":
        case "ww7.readsnk.com":
        case "ww3.readbleachmanga.com":
            readnarutoF();
            break;
        case "ww5.readblackclover.com":
        case "ww6.readblackclover.com":
        case "ww6.dbsmanga.com":
        case "ww7.readonepiece.com":
        case "ww8.readonepiece.com":
        case "ww3.readhaikyuu.com":
        case "ww4.readhaikyuu.com":
        case "ww6.readhaikyuu.com":
        case "ww5.readmha.com":
        case "ww6.readmha.com":
        case "readjujutsukaisen.com":
        case "ww1.readjujutsukaisen.com":
        case "readchainsawman.com":
        case "ww1.readchainsawman.com":
        case "ww2.demonslayermanga.com":
        case "ww4.demonslayermanga.com":
        case "ww5.demonslayermanga.com":
        case "ww2.readdrstone.com":
        case "ww3.readdrstone.com":
        case "ww6.readnaruto.com":
        case "ww7.readnaruto.com":
        case "ww7.tokyoghoulre.com":
        case "ww8.tokyoghoulre.com":
        case "ww4.readfairytail.com":
        case "ww1.readkingdom.com":
        case "ww2.readkingdom.com":
        case "readkaguyasama.com":
        case "ww1.readkaguyasama.com":
        case "readsololeveling.org":
        case "ww2.readneverland.com":
        case "ww3.readneverland.com":
        case "ww1.readvinlandsaga.com":
        case "ww3.read7deadlysins.com":
        case "ww2.readhxh.com":
            readblackcloverF();
            break;
        case "ww5.readopm.com":
        case "readberserk.com":
            readopmF();
            break;
        case "kiryuu.org":
            kiryuuF();
            break;
        case "mangadex.org":
            mangadexF();
            break;
        case "mangasee123.com":
        case "manga4life.com":
            mangasee123F();
            break;
        case "www.webtoons.com":
            webtoonsF();
            break;
        case "www.sailmg.com":
            mangasailF();
            break;
        case "www.mangatown.com":
            mangatownF();
            break;
        case "klz9.com":
            loveheavenF();
            break;
        default:
            // alert("This should not happen");
            // this switch is for controlling which function should be called
            // just to not call all the functions
            break;
    }
}
