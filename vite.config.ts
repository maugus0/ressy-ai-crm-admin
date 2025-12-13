import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Get base path from environment variable or use repo name
  // For GitHub Pages: if repo is "username/repo-name", base will be "/repo-name/"
  // Set VITE_BASE_PATH in GitHub Actions or use default
  const base = process.env.VITE_BASE_PATH || "/";

  return {
    base,
    server: {
      host: "::",
      port: 8080,
      watch: {
        usePolling: true,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      // Plugin to inject base URL into HTML for assets and meta tags
      {
        name: "html-transform",
        transformIndexHtml(html) {
          // Replace absolute paths with base URL relative paths
          let transformed = html;
          
          // Fix favicon
          transformed = transformed.replace(/href=["']\/favicon\.ico["']/g, `href="${base}favicon.ico"`);
          
          // Fix Open Graph and Twitter image paths
          transformed = transformed.replace(/content=["']\/ressy-logo\.png["']/g, `content="${base}ressy-logo.png"`);
          
          // Fix canonical URL
          transformed = transformed.replace(/<link\s+rel=["']canonical["']\s+href=["']\/["']/g, `<link rel="canonical" href="${base}"`);
          
          // Fix og:url
          transformed = transformed.replace(/<meta\s+property=["']og:url["']\s+content=["']\/["']/g, `<meta property="og:url" content="${base}"`);
          
          return transformed;
        },
      },
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
    },
  };
});
