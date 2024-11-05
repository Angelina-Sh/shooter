/*
const img = new Image();

img.onload = () => startGame();

img.src = url;
*/

(() => {
    const resourceCache = {};
    const loading = [];
    const readyCallbacks = [];

    // Load an image url or an array of image urls
    const load = (urlOrArr) => {
        if(urlOrArr instanceof Array) {
            urlOrArr.forEach((url) => {
                _load(url);
            });
        }
        else {
            _load(urlOrArr);
        }
    }

    const _load = (url) => {
        if(resourceCache[url]) {
            return resourceCache[url];
        }
        else {
            var img = new Image();
            img.onload = () => {
                resourceCache[url] = img;

                if(isReady()) {
                    readyCallbacks.forEach((func) => func());
                }
            };
            resourceCache[url] = false;
            img.src = url;
        }
    }

    const get = (url) => {
        return resourceCache[url];
    }

    const isReady = () => {
        var ready = true;
        for(var k in resourceCache) {
            if(resourceCache.hasOwnProperty(k) &&
               !resourceCache[k]) {
                ready = false;
            }
        }
        return ready;
    }

    const onReady = (func) => {
        readyCallbacks.push(func);
    }

    window.resources = { 
        load: load,
        get: get,
        onReady: onReady,
        isReady: isReady
    };
})();