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
        message: string;
    }
    |
    {
        kind: "udp:config";
        address: string;
        port: number;
    }
    |
    {
        kind: "udp:send";
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
