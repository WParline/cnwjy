import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://cnwjy.site",
  output: "static",
  integrations: [react(), tailwind()],
});
