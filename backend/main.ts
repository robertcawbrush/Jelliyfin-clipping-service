/// <reference lib="deno.ns" />
import { config } from "@bearz/dotenv";

const env = await config();

Deno.serve((_req: Request) => {
    return new Response("Hello, Deno!", { status: 200 });
});
