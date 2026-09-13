import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.integration.test.ts"],
    setupFiles: ["./vitest.env.ts", "./vitest.setup.ts"],
  },
});
