if (typeof browser == "undefined") {
    globalThis.browser = chrome;
}

// rate limit timing in milliseconds
let rateLimitParams;
const DEFAULT_RATE_LIMIT = { min: 500, rand: 150 };

// must be called and completed before any function that uses options
async function initOptions() {
    browser.storage.local.onChanged.addListener(optionsChanged);

    return browser.storage.local.get({
        rateLimit: DEFAULT_RATE_LIMIT
    }).then((items) => {
        rateLimitParams = items.rateLimit;
    });
}

function optionsChanged(changes) {
    if (rateLimitParams !== undefined && "rateLimit" in changes) {
        if ("newValue" in changes.rateLimit) {
            Object.assign(rateLimitParams, changes.rateLimit.newValue);
        } else {
            Object.assign(rateLimitParams, DEFAULT_RATE_LIMIT);
        }
    }
}

function getRateLimitParams() {
    if (!rateLimitParams) {
        throw "Options have not been properly initialized";
    }

    return Object.assign({}, rateLimitParams);
}

async function setRateLimitParams(params) {
    if (!rateLimitParams) {
        throw "Options have not been properly initialized";
    }

    if (params) {
        Object.assign(rateLimitParams, params);
        return browser.storage.local.set({ rateLimit: params });
    } else {
        Object.assign(rateLimitParams, DEFAULT_RATE_LIMIT);
        return browser.storage.local.remove("rateLimit");
    }
}
