// vite.config.ts
import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

export default defineConfig(({ mode }) => ({
  plugins: [react(), expressPlugin()],

  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
    // >>> Thêm proxy cho backend FastAPI
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        // secure: false, // bật nếu backend dùng https self-signed
        // rewrite: (p) => p, // không cần rewrite path
      },
    },
  },

  // (tuỳ chọn) alias cho đường dẫn import gọn
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),
      "~shared": path.resolve(__dirname, "shared"),
    },
  },

  // (nếu bạn có cấu hình build khác, có thể thêm tiếp ở đây)
  // build: { ... }
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // chỉ chạy ở chế độ dev
    configureServer(server) {
      const app = createServer();
      // gắn Express app vào Vite dev server làm middleware
      server.middlewares.use(app);
    },
  };
}
