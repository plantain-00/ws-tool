declare class Request {
    url: string;
}
declare class Response {
    clone(): Response;
}
declare function fetch(url: string | Request): Promise<Response>;

declare class ExtendableEvent extends Event {
    waitUntil<T>(promise: Promise<T>): void;
}

declare class InstallEvent extends ExtendableEvent { }
declare class FetchEvent extends ExtendableEvent {
    request: Request;
    respondWith(promise: Promise<Response>): void;
}
declare class ActivateEvent extends ExtendableEvent { }

declare class Cache {
    addAll(requests: string[]): Promise<void>;
    put(request: Request, response: Response): void;
}

declare const caches: {
    delete: (cacheName: string) => Promise<boolean>;
    has: (cacheName: string) => Promise<boolean>;
    open: (cacheName: string) => Promise<Cache>;
    keys: () => Promise<string[]>;
    match(request: Request | string, options?: Partial<{ ignoreSearch: boolean; ignoreMethod: boolean; ignoreVary: boolean; cacheName: string }>): Promise<Response>;
};

const versions: {
    indexBundleCss: string;
    vendorBundleCss: string;
    indexBundleJs: string;
    vendorBundleJs: string;
    indexHtml: string;
} = require("./version.json");

const rootUrl = location.origin + location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1);

const cacheMappers = [
    { cacheName: rootUrl + versions.indexHtml, url: rootUrl },
    { cacheName: rootUrl + versions.indexHtml, url: rootUrl + "index.html" },
    { cacheName: rootUrl + versions.indexBundleCss, url: rootUrl + versions.indexBundleCss },
    { cacheName: rootUrl + versions.vendorBundleCss, url: rootUrl + versions.vendorBundleCss },
    { cacheName: rootUrl + versions.indexBundleJs, url: rootUrl + versions.indexBundleJs },
    { cacheName: rootUrl + versions.vendorBundleJs, url: rootUrl + versions.vendorBundleJs },
];

function run(this: any) {
    this.addEventListener("fetch", (event: FetchEvent) => {
        if (!event.request.url.startsWith("http")) {
            return;
        }
        event.respondWith(
            caches.match(event.request).then(responseInCache => {
                if (responseInCache) {
                    return responseInCache;
                }
                return fetch(event.request).then(response => {
                    const cacheMapper = cacheMappers.find(c => c.url === event.request.url);
                    if (!cacheMapper) {
                        return response;
                    }

                    caches.open(cacheMapper.cacheName).then(cache => {
                        cache.put(event.request, response);
                    });
                    return response.clone();
                });
            }).catch(() => {
                return caches.match("/404.png");
            }),
        );
    });

    this.addEventListener("activate", (event: ActivateEvent) => {
        event.waitUntil(
            caches.keys().then(keyList => {
                return Promise.all(keyList.filter(key => cacheMappers.findIndex(c => c.cacheName === key) === -1).map(key => caches.delete(key)));
            }),
        );
    });
}

run();
