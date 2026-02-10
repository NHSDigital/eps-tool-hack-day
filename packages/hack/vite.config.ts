import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: "/site/",
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    proxy: {
      "/api": {
        target: "https://hackapp-pr-11.dev.eps.national.nhs.uk",
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            proxyReq.setHeader("Origin", "https://hackapp-pr-11.dev.eps.national.nhs.uk");
            proxyReq.setHeader("Referer", "https://hackapp-pr-11.dev.eps.national.nhs.uk/");
          });
        },
      },
    },
  },
});
