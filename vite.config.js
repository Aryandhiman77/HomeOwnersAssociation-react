import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { Buffer } from "node:buffer";
import process from "node:process";

const backendUrl =
  process.env.VITE_BACKEND_PROXY_URL ||
  process.env.VITE_API_BASE_URL ||
  "https://hoanightmares.org";
// "https://hoa-backend-adic.onrender.com";

function localApiProxy() {
  return {
    name: "local-api-proxy",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const requestUrl = request.url || "";

        // Strip query string for route matching
        const pathname = requestUrl.split("?")[0];

        // Only proxy backend/API paths. /admin/* remains a React frontend route.
        const isApiPath = pathname.startsWith("/api/");
        const isUploadPath =
          pathname.startsWith("/uploads/") || pathname === "/uploads";

        if (!isApiPath && !isUploadPath) {
          next();
          return;
        }

        // Everything else under /api/* or /uploads/* → proxy to backend
        try {
          const chunks = [];

          for await (const chunk of request) {
            chunks.push(chunk);
          }

          const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;
          const headers = new Headers();
          const skipHeaders = new Set([
            "host",
            "connection",
            "transfer-encoding",
            "te",
            "trailer",
            "upgrade",
            "keep-alive",
            "proxy-authorization",
            "proxy-connection",
            "accept-encoding",
            "expect",
            "origin",
            "referer",
          ]);

          Object.entries(request.headers).forEach(([key, value]) => {
            if (skipHeaders.has(key.toLowerCase()) || value === undefined) {
              return;
            }
            if (Array.isArray(value)) {
              value.forEach((item) => headers.append(key, item));
              return;
            }
            headers.set(key, value);
          });

          const backendResponse = await fetch(`${backendUrl}${requestUrl}`, {
            method: request.method,
            headers,
            body: ["GET", "HEAD"].includes(request.method || "")
              ? undefined
              : body,
            redirect: "manual",
          });

          response.statusCode = backendResponse.status;
          backendResponse.headers.forEach((value, key) => {
            const lower = key.toLowerCase();
            if (
              lower === "transfer-encoding" ||
              lower === "content-encoding" ||
              lower === "content-length"
            ) {
              return;
            }
            response.setHeader(key, value);
          });

          const responseBody = await backendResponse.arrayBuffer();
          response.end(Buffer.from(responseBody));
        } catch (error) {
          response.statusCode = 502;
          response.setHeader("Content-Type", "application/json");
          response.end(
            JSON.stringify({
              success: false,
              message: error.message || "Local API proxy failed.",
              cause: error.cause?.message,
            }),
          );
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [localApiProxy(), react(), tailwindcss()],
});
