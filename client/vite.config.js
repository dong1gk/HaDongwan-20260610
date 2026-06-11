import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 로컬 개발 시 /api 요청을 백엔드로 프록시
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
});
