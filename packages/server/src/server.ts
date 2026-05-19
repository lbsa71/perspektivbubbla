import { createAppServer } from "./app.ts";

const port = Number(process.env.PORT ?? 5173);
const app = createAppServer();

await app.listen(port);

console.log(`Perspektivbubbla group commander view running at http://127.0.0.1:${port}`);
