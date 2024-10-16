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
        case "mangakomi.io":
        case "toonily.com":
        case "mangatx.to":
        case "manhuaplus.com":
        case "toonclash.com":
        case "manhuaus.com":
            mangakissF();
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
        case "fanfox.net":
            fanfoxF();
            break;
        default:
            let domain = host.split(".").slice(-2).join(".");
            switch (domain) {
                case "readsnk.com":
                case "readbleachmanga.com":
                case "readblackclover.com":
                case "dbsmanga.com":
                case "readonepiece.com":
                case "readhaikyuu.com":
                case "readmha.com":
                case "readjujutsukaisen.com":
                case "readchainsawman.com":
                case "demonslayermanga.com":
                case "readdrstone.com":
                case "readnaruto.com":
                case "tokyoghoulre.com":
                case "readfairytail.com":
                case "readkingdom.com":
                case "readkaguyasama.com":
                case "readsololeveling.org":
                case "readneverland.com":
                case "readvinlandsaga.com":
                case "read7deadlysins.com":
                case "readhxh.com":
                case "readkagurabachimanga.com":
                case "readichithewitch.com":
                case "bluelockread.com":
                case "readjojos.com":
                case "readsakadays.com":
                case "readundead.com":
                case "readtokyorevengers.net":
                    readblackcloverF();
                    break;
                case "readopm.com":
                case "readberserk.com":
                    readopmF();
                    break;
                default:
                    // this switch is for controlling which function should be called
                    // just to not call all the functions
                    console.log("Unhandled host: "+host);
                break;
            }
            break;
    }
}
