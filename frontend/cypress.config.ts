import { defineConfig } from "cypress";
import createBundler from "@bahmutov/cypress-esbuild-preprocessor";
import { addCucumberPreprocessorPlugin } from "@badeball/cypress-cucumber-preprocessor";
import createEsbuildPlugin from "@badeball/cypress-cucumber-preprocessor/esbuild";

export default defineConfig({
  e2e: {
    // Run both cucumber .feature files and classic Cypress specs
    specPattern: ["**/*.feature", "cypress/e2e/**/*.cy.{js,ts}"],
    baseUrl: "http://localhost:5173",
    viewportWidth: 1280,
    viewportHeight: 800,
    supportFile: "cypress/support/e2e.js",
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);

      on(
        "file:preprocessor",
        createBundler({
          plugins: [createEsbuildPlugin(config)],
        })
      );

      return config;
    },
  },
});
