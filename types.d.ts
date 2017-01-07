export type Protocol =
    {
        kind: "tcp:connect";
        host: string;
        port: number;
    }
    |
    {
        kind: "tcp:connected";
    }
    |
    {
        kind: "tcp:disconnect";
    }
    |
    {
        kind: "tcp:disconnected";
    }
    |
    {
        kind: "tcp:send";
        isBinary: boolean;
        message: string;
    }
    |
    {
        kind: "udp:send";
        address: string;
        port: number;
        isBinary: boolean;
        message: string;
    }
    |
    {
        kind: "http:send";
        method: string;
        url: string;
        headers: { [name: string]: string };
        body: string;
    };
