/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => { 
  const env = loadEnv(mode, process.cwd(), "");
  const proxy = {
    "/api": {
      target: env.TILT_HOST ? `http://${env.TILT_HOST}:4024` : "http://localhost:3333",
      changeOrigin: true,
      secure: false,
      ws: true,
      headers: {
        "x-planner-userid":
          env.VITE_PLANNER_USERID ??
          "f1750ac3-d6cc-4981-9466-f1de2ebbad33"
      },
    },
  };

  return {
    preview: {
      port:3000
    },
    server: {
      port:3000,
      proxy,
    },
    plugins: [
      react(),
    ],
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "test-setup.ts",
    },
  };
});
