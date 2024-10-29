import argparse
import copy
import hashlib
import json
import logging
import os
import os.path
import re
import shutil
import subprocess
import sys
import urllib.request
import zipfile


def parse_args():
    parser = argparse.ArgumentParser(description="Create browser-specific extension packages")
    parser.add_argument("--chrome", action=argparse.BooleanOptionalAction, default=True, help="Emit extension package for Chrome")
    parser.add_argument("--firefox", action=argparse.BooleanOptionalAction, default=True, help="Emit extension package for Firefox")
    parser.add_argument("--firefox-update", action=argparse.BooleanOptionalAction, default=False, help="Emit extension update manifest for Firefox")
    parser.add_argument("-f", "--force", action="store_true", help="Overwrite existing output files")
    parser.add_argument("-t", "--tag", help="Use specific version number for output filename instead of querying git tag")

    return parser.parse_args()
    

def get_version_tag(srcdir):
    git = shutil.which("git")
    if git is None:
        sys.exit("ERROR: git not found in PATH")
    comp = subprocess.run([git, "describe", "--dirty", "--tags", "--long"], cwd=srcdir, stdout=subprocess.PIPE, text=True)
    if comp.returncode != 0:
        sys.exit("ERROR: git failed")
    gitout = comp.stdout.strip()
    parts_re = re.compile(r"(.*)-(\d+)-g[^-]*(|-dirty)")
    parts = parts_re.fullmatch(gitout)
    if parts is None:
        sys.exit("ERROR: unable to parse git tag output: "+gitout)
    if parts.group(3):
        # dirty
        tag = "999.999.999.999"
    else:
        tag = parts.group(1)
        extra_changes = int(parts.group(2))
        if extra_changes:
            tag += "." + str(900+extra_changes)
    return tag


def read_manifest(srcdir):
    try:
        manifest_in = open(os.path.join(srcdir, "manifest.json"), "r")
    except OSError as e:
        sys.exit("ERROR: Could not open manifest.json: "+str(e))
    try:
        return json.load(manifest_in)
    except JSONDecodeError as e:
        sys.exit("ERROR: Could not parse manifest.json: "+str(e))
    finally:
        manifest_in.close()


def open_file(filename, force, binary):
    try:
        return open(filename, ("wb" if force else "xb") if binary else ("w" if force else "x"))
    except FileExistsError:
        logging.error(filename+" already exists. Use --force to overwrite it.")
    except OSError as e:
        logging.error("Failed to open "+filename+": "+str(e))
    return None


def open_package_file(suffix, tag, force):
    filename = "Manga-Downloader-{}-{}.zip".format(tag, suffix)
    return open_file(filename, force, True)


def open_update_file(prefix, tag, force):
    filename = "{}-{}.json".format(prefix, tag)
    return open_file(filename, force, False)


# not at all robust, but will work for the expected html files
def find_script_tags(html_filename):
    js_filenames = []
    with open(html_filename, "r") as file:
        script_re = re.compile(r'<script\W+src="([^"]*)"')
        for line in file:
            parts = script_re.search(line)
            if parts is not None:
                js_filenames.append(parts.group(1))
    return js_filenames


def emit_chrome_package(file, manifest):
    manifest = copy.deepcopy(manifest)
    del manifest["background"]["scripts"]
    del manifest["browser_specific_settings"]
    include_files = []
    include_files.extend(manifest["icons"].values())
    include_files.append(manifest["options_ui"]["page"])
    include_files.extend(find_script_tags(manifest["options_ui"]["page"]))
    include_files.extend(manifest["content_scripts"][0]["js"])
    include_files.extend(manifest["content_scripts"][0]["css"])
    include_files.append(manifest["background"]["service_worker"])
    with zipfile.ZipFile(file, mode="w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zfile:
        zinfo = zipfile.ZipInfo.from_file("manifest.json")
        manistr = json.dumps(manifest, indent=4)
        zfile.writestr(zinfo, manistr)
        for ifile in include_files:
            zfile.write(ifile)


def emit_firefox_package(file, manifest):
    manifest = copy.deepcopy(manifest)
    del manifest["background"]["service_worker"]
    manifest["permissions"].remove("declarativeNetRequestWithHostAccess")
    if not manifest["permissions"]:
        del manifest["permissions"]
    include_files = []
    include_files.extend(manifest["icons"].values())
    include_files.append(manifest["options_ui"]["page"])
    include_files.extend(find_script_tags(manifest["options_ui"]["page"]))
    include_files.extend(manifest["content_scripts"][0]["js"])
    include_files.extend(manifest["content_scripts"][0]["css"])
    include_files.extend(manifest["background"]["scripts"])
    with zipfile.ZipFile(file, mode="w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zfile:
        zinfo = zipfile.ZipInfo.from_file("manifest.json")
        manistr = json.dumps(manifest, indent=4)
        zfile.writestr(zinfo, manistr)
        for ifile in include_files:
            zfile.write(ifile)


def emit_firefox_update_manifest(file, manifest):
    tag = manifest["version"]
    extension_id = manifest["browser_specific_settings"]["gecko"]["id"]
    update_url = "https://github.com/sparky8512/Manga-Downloader-Plus/releases/download/{}/Manga-Downloader-{}-Firefox.xpi".format(tag, tag)
    update_manifest = {
        "addons": {
            extension_id: {
                "updates": [
                    {
                        "version": tag,
                        "update_link": update_url
                    }
                ]
            }
        }
    };

    try:
        file_hash = hashlib.sha256()
        with urllib.request.urlopen(update_url) as response:
            while True:
                data = response.read(64*1024)
                if not data:
                    break
                file_hash.update(data)
        update_manifest["addons"][extension_id]["updates"][0]["update_hash"] = "sha256:{}".format(file_hash.hexdigest())
    except urllib.error.HTTPError:
        pass

    json.dump(update_manifest, file, indent=4)


def main():
    opts = parse_args()
    srcdir = os.path.join(os.path.dirname(__file__), "..", "src")
    if opts.tag is None:
        opts.tag = get_version_tag(srcdir)
    manifest_data = read_manifest(srcdir)
    manifest_data["version"] = opts.tag
    if opts.chrome:
        chrome_file = open_package_file("Chrome", opts.tag, opts.force)
    if opts.firefox:
        firefox_file = open_package_file("Firefox", opts.tag, opts.force)
    if opts.firefox_update:
        firefox_update_file = open_update_file("firefox_update", opts.tag, opts.force)
    os.chdir(srcdir)
    if opts.chrome and chrome_file is not None:
        try:
            emit_chrome_package(chrome_file, manifest_data)
        finally:
            chrome_file.close()
    if opts.firefox and firefox_file is not None:
        try:
            emit_firefox_package(firefox_file, manifest_data)
        finally:
            firefox_file.close()
    if opts.firefox_update and firefox_update_file is not None:
        emit_firefox_update_manifest(firefox_update_file, manifest_data)

    sys.exit(0)


if __name__ == "__main__":
    logging.basicConfig(format="%(levelname)s: %(message)s")
    main()
