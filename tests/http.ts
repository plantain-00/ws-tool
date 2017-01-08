import * as express from "express";
const app = express();

const port = 9997;

app.all("*", (request, response) => {
    console.log(request.method);
    console.log(request.headers);
    const chunks: Buffer[] = [];
    request.on("data", chunk => {
        chunks.push(chunk as Buffer);
    });
    request.on("end", () => {
        const buffer = Buffer.concat(chunks);
        console.log(buffer);
        response.setHeader("x-a", "b");
        // response.json({ a: 1 });
        response.send(new Uint8Array([1, 2]));
    });
});

app.listen(port, () => {
    console.log(`Listening ${port}`);
});
