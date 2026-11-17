import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// Build configuration owned by the project.
// src/server.ts is detected automatically by TanStack Start as the custom server entry.
export default defineConfig({
  plugins: [tailwindcss(), tanstackStart(), nitro(), viteReact(), tsconfigPaths()],
});
