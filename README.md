NOTE: This is a fork of https://github.com/AllaliAdil/Manga-Downloader-Extension, which is no longer being maintained.

---

# Considerations for running this extension

The changes on this fork have not been published to either of the Firefox or Chrome web stores, so using it requires loading via the browser's extension developer mode.

### Using browser profiles in Firefox

Given the fairly wide set of websites this extension needs permission to access in order to do its job, it's a good idea to enable it only in a separate profile from the (probably default) one you use for every day browsing.

Firefox does not expose profiles in its UI the way that Chrome and Edge do. You can create a new one easily enough by entering `about:profiles` in the address bar, pressing the "Create New Profile" button, and then following the wizard instructions. However, actually using your new profile can be a pain. I found it best to change all the shortcuts (or equivalent) that launch Firefox to do so with a specific profile by adding `-P <profile name>` to the command line. There's a more thorough walkthrough on this topic in [this reddit post](https://www.reddit.com/r/firefox/comments/xtv2do/how_to_create_multiple_firefox_profiles_and/) and more complete instructions for the `about:profiles` page on [this Firefox Support page](https://support.mozilla.org/en-US/kb/profile-manager-create-remove-switch-firefox-profiles).

### How to load in development mode in Firefox

First, get a copy of the repository either by cloning it with git or by using the "Download ZIP" option in the green Code button above. If using the ZIP archive, unpack it.

Then enter `about:debugging` in the address bar, select "This Firefox" on the page that comes up, and click on "Load Temporary Add-on". Next, select the file `manifest.json` from the `src` directory of the repository. Finally, click the "Open" button.

As the word "Temporary" implies, this will need to be repeated every time you restart your browser session. More thorough instructions can be found [here](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/).

Note that loading extensions this way bypasses warnings about any scary permissions the extension is granted at install time, so you may want to review its permissions list in the extension manager (`about:addons`).

### How to load in development mode in Chrome or Edge

As with Firefox, first get a copy of the repository. Then from the extensions menu, select Manage Extensions. Next, flip on the "Developer mode" toggle. Finally, click on "Load unpacked" and select the `src` directory of the repository.

---

# IMPORTANT NOTE

New websites will not be add for now, unless they are clones of an already supported one. The SOURCE CODE is available, you can add the websites you want.  

# Supported Websites

As of 2024-Oct, the following websites have been confirmed to work:

- `mangakiss.org`
- `mangakomi.io` (`mangakomi.com` redirects here)
- `toonily.com`
- `mangatx.to`
- `manhuaplus.com`
- `toonclash.com` (Manga Clash)
- `manhuaus.com`
- `mangakakalot.com`
- `manganelo.com`
- `manganato.com`
- `readopm.com` (One Punch Man)
- `readberserk.com`
- `kiryuu.org`
- `mangasee123.com`
- `manga4life.com`
- `webtoons.com`
- `mangatown.com`
- `readhaikyuu.com`
- `readsnk.com` (Shingeki no Kyojin)
- `readbleachmanga.com`
- `readblackclover.com`
- `dbsmanga.com` (Dragon Ball Super)
- `readonepiece.com`
- `readmha.com` (My Hero Academia)
- `readjujutsukaisen.com`
- `readchainsawman.com`
- `demonslayermanga.com`
- `readdrstone.com`
- `readnaruto.com`
- `tokyoghoulre.com`
- `readfairytail.com`
- `readkingdom.com`
- `readkaguyasama.com`
- `readsololeveling.org`
- `readneverland.com`
- `readvinlandsaga.com`
- `read7deadlysins.com`
- `readhxh.com` (Hunter X Hunter)
- `readkagurabachimanga.com`
- `readichithewitch.com`
- `bluelockread.com`
- `readjojos.com`
- `readsakadays.com`
- `readundead.com` (Undead Unluck)
- `readtokyorevengers.net`
- `sailmg.com` (MangaSail, `mangasaki.com` now also redirects here)
- `klz9.com` (formerly `kissaway.net` and `klmanga.com`)
- `fanfox.net` (Manga Fox)

The following previously supported websites appear to be permanently offline:

- `mangareader.net` (there's a `mangareader.to`, but that appears to be a different site)
- `mangapanda.com` (there's a `mangapanda.io`, but that appears to be a different site)
- `mangazone.cc`
- `mangafort.com`
- `1stkissmanga.com` / `1stkissmanga.io`
- `zinmanga.com`
- `365manga.com`
- `toonily.net` (`toonily.com` is supported, but that appears to be a different site)
- `mangatx.com` (`mangatx.to` is supported, which looks like it may be same site)
- `aloalivn.com`
- `manhuasworld.com`
- `mangafox.online` (there's a `fanfox.net` that brands itself as Manga Fox, but that appears to be a different site)
- `kissmanga.com`
- `readnoblesse.com`
- `readtowerofgod.com`
- `rawdevart.com` (there's a `rawdevart.art`, but that appears to be a different site)
- `mangatail.me` (used to redirect to `mangasaki.com`)
- `readmanhwa.com`
- `loveheaven.net`
- `qiman6.com`
- `qingman5.com`
- `full-metal-alchemist.com`
- `funmanga.com`
- `mngdoom.com`
- `mangainn.net`
- `mangafast.net`
- `lovehug.net`

