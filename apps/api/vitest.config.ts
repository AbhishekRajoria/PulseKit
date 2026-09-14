import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.integration.test.ts"],
    fileParallelism: false,
    setupFiles: ["./vitest.env.ts", "./vitest.setup.ts"],
  },
});
