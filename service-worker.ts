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

const versions = require("./version.json");

const rootPath = "/";
const version = "v2";

function run(this: any) {
    this.addEventListener("install", (event: InstallEvent) => {
        event.waitUntil(
            caches.open(version).then(cache => {
                return cache.addAll([
                    rootPath,
                    rootPath + "index.html",
                    rootPath + versions.vendorBundleCss,
                    rootPath + versions.indexBundleCss,
                    rootPath + versions.vendorBundleJs,
                    rootPath + versions.indexBundleJs,
                ]);
            }),
        );
    });

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
                    caches.open(version).then(cache => {
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
                return Promise.all(keyList.filter(key => key !== version).map(key => caches.delete(key)));
            }),
        );
    });
}

run();
