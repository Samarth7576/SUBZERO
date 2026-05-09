import { syncAllGmailSources } from "../lib/gmail/sync";
import { inngest } from "./client";

export const gmailSync = inngest.createFunction(
  {
    id: "gmail.sync",
    name: "Gmail raw event sync",
    triggers: [{ cron: "0 */6 * * *" }],
  },
  async ({ step }) => {
    return step.run("sync connected Gmail accounts", async () =>
      syncAllGmailSources(),
    );
  },
);

export const functions = [gmailSync];
