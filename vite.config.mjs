export default {
  root: "packages/client/public",
  publicDir: false,
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: false,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5174",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://127.0.0.1:5174",
        ws: true,
      },
    },
  },
};
