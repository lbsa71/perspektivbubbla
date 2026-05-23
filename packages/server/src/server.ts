import { createAppServer } from "./app.ts";

const port = Number(process.env.PORT ?? 5173);
const host = process.env.HOST ?? "127.0.0.1";
const app = createAppServer();

await app.listen(port, host);

console.log(`Perspektivbubbla group commander view running at http://${host}:${port}`);
