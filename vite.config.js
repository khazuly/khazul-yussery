import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { handleChatProxy } from "./server/chatProxy.mjs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "portfolio-chat-proxy",
      configureServer(server) {
        server.middlewares.use("/api/chat", async (req, res) => {
          await handleChatProxy(req, res);
        });
      }
    }
  ]
});
