import { defineConfig } from "cypress";
import { allureCypress } from "allure-cypress/reporter"
import { Status } from "allure-js-commons";
import * as os from "node:os";
import { plugin as cypressGrepPlugin } from '@cypress/grep/plugin'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      cypressGrepPlugin(config)
      allureCypress(on, config, {
        resultsDir: "allure-results",
        links: {
          issue: {
            nameTemplate: "Issue #%s",
            urlTemplate: "https://issues.example.com/%s",
          },
          tms: {
            nameTemplate: "TMS #%s",
            urlTemplate: "https://tms.example.com/%s",
          },
          jira: {
            urlTemplate: (v) => `https://jira.example.com/browse/${v}`,
          },
        },
        categories: [
          {
            name: "foo",
            messageRegex: "bar",
            traceRegex: "baz",
            matchedStatuses: [Status.FAILED, Status.BROKEN],
          },
        ],
        environmentInfo: {
          os_platform: os.platform(),
          os_release: os.release(),
          os_version: os.version(),
          node_version: process.version,
        },
        globalLabels: [{ name: "layer", value: "api" }],
      });
    },
  },
});
