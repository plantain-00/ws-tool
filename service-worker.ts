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

const rootPath = location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1);
const rootUrl = location.origin + rootPath;

const cacheNames = [
    location.origin + rootPath + versions.indexHtml,
    location.origin + rootPath + versions.indexBundleCss,
    location.origin + rootPath + versions.vendorBundleCss,
    location.origin + rootPath + versions.indexBundleJs,
    location.origin + rootPath + versions.vendorBundleJs,
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
                    if (event.request.url !== rootUrl && cacheNames.indexOf(event.request.url) === -1) {
                        return response;
                    }

                    const cacheName = event.request.url === rootUrl ? cacheNames[0] : event.request.url;
                    caches.open(cacheName).then(cache => {
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
                return Promise.all(keyList.filter(key => cacheNames.indexOf(key) === -1).map(key => caches.delete(key)));
            }),
        );
    });
}

run();
