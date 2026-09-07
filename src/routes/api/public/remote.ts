import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_PREFIXES = ["image/", "video/", "audio/"];

// 1x1 transparent PNG: keeps a bad/missing remote link from turning into a
// server error (502) that the app reports as a runtime failure.
const TRANSPARENT_PNG = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  ),
  (c) => c.charCodeAt(0),
);

function placeholder() {
  return new Response(TRANSPARENT_PNG, {
    status: 200,
    headers: { "content-type": "image/png", "cache-control": "public, max-age=60" },
  });
}

export const Route = createFileRoute("/api/public/remote")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const target = new URL(request.url).searchParams.get("url");
        if (!target) return new Response("Missing url", { status: 400 });

        let parsed: URL;
        try {
          parsed = new URL(target);
        } catch {
          return new Response("Invalid url", { status: 400 });
        }
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          return new Response("Invalid protocol", { status: 400 });
        }
        // Block internal network targets (SSRF protection).
        const host = parsed.hostname.toLowerCase();
        if (
          host === "localhost" ||
          host === "0.0.0.0" ||
          host.endsWith(".local") ||
          /^127\./.test(host) ||
          /^10\./.test(host) ||
          /^192\.168\./.test(host) ||
          /^169\.254\./.test(host) ||
          /^172\.(1[6-9]|2\d|3[01])\./.test(host)
        ) {
          return new Response("Forbidden host", { status: 403 });
        }

        let upstream: Response;
        try {
          upstream = await fetch(parsed.toString(), {
            headers: {
              // Some hosts reject requests without a browser-like UA.
              "user-agent": "Mozilla/5.0 (compatible; LovableMediaProxy/1.0)",
              accept: "image/*,video/*,*/*;q=0.8",
              ...(request.headers.get("range") ? { range: request.headers.get("range")! } : {}),
            },
            redirect: "follow",
          });
        } catch {
          return placeholder();
        }

        if (!upstream.ok && upstream.status !== 206) {
          return placeholder();
        }

        const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
        if (!ALLOWED_PREFIXES.some((p) => contentType.toLowerCase().startsWith(p))) {
          return placeholder();
        }

        const headers = new Headers({
          "content-type": contentType,
          // Long-lived caching so media keeps showing when the network drops.
          "cache-control": "public, max-age=604800, stale-while-revalidate=86400, stale-if-error=2592000",

        });
        const length = upstream.headers.get("content-length");
        if (length) headers.set("content-length", length);
        const range = upstream.headers.get("content-range");
        if (range) headers.set("content-range", range);
        headers.set("accept-ranges", upstream.headers.get("accept-ranges") ?? "bytes");

        return new Response(upstream.body, { status: upstream.status, headers });
      },
    },
  },
});
