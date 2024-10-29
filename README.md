NOTE: This is a fork of https://github.com/AllaliAdil/Manga-Downloader-Extension, which does not appear to be maintained any longer.

---

# Considerations for running this extension

The changes on this fork have not been published to either of the Firefox or Chrome web stores, so using it requires some manual loading.

### Installing on Firefox

To install the latest release on Firefox browser, click [this link](https://github.com/sparky8512/Manga-Downloader-Plus/releases/latest/download/Manga-Downloader-Firefox.xpi) to install the signed .xpi file. That will install it as a normal extension, just one that gets updates from here instead of the Mozilla add-ons store. If you don't want it to update automatically, you can disable that via the Manage Extension menu item.

You can also load either the .zip file from the release assets or directly from a clone of this repository using extension development mode. You can find detailed instructions for that [here](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/), but you should only do this if you know what you're doing.

### Installing on Chrome or Edge

To install on Chrome or Edge browser (or other Chromium-based browser), first either download the Chrome .zip file from the release assets (latest one is [here](https://github.com/sparky8512/Manga-Downloader-Plus/releases/latest/download/Manga-Downloader-Chrome.zip)), or clone this repository. If using a release .zip file, extract it to an empty directory. Then from the extensions menu, select Manage Extensions, flip on the "Developer mode" toggle, and then click on "Load unpacked". Finally, select either the directory you extracted the .zip file to or the `src` directory of the cloned repository.

### Using browser profiles in Firefox

Given the fairly wide set of websites this extension needs permission to access in order to do its job, it's a good idea to enable it only in a separate profile from the (probably default) one you use for every day browsing.

Firefox does not expose profiles in its UI the way that Chrome and Edge do. You can create a new one easily enough by entering `about:profiles` in the address bar, pressing the "Create New Profile" button, and then following the wizard instructions. However, actually using your new profile can be a pain. I found it best to change all the shortcuts (or equivalent) that launch Firefox to do so with a specific profile by adding `-P <profile name>` to the command line. There's a more thorough walkthrough on this topic in [this reddit post](https://www.reddit.com/r/firefox/comments/xtv2do/how_to_create_multiple_firefox_profiles_and/) and more complete instructions for the `about:profiles` page on [this Firefox Support page](https://support.mozilla.org/en-US/kb/profile-manager-create-remove-switch-firefox-profiles).

---

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

