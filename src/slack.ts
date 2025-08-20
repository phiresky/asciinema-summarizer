import slack from "@slack/bolt";
import "dotenv/config";
import { readFile } from "fs/promises";
import { summarizeAsciinema } from "./summarizeAsciinema.ts";
import { join } from "path";
import type { CliOptions } from "./types.ts";

const config = {
  opts: {
    enableThinking: true,
    showOutput: true,
    model: "qwen3:30b",
    host: "localhost",
    port: 11434,
    converter: "asciinema-convert",
  } satisfies CliOptions,
  dataBaseDir: ".",
};
// Initializes your app in socket mode with your app token and signing secret
const app = new slack.App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true, // add this
  appToken: process.env.SLACK_APP_TOKEN,
});
app.event("reaction_added", async ({ event, say }) => {
  console.log("reaction_added event received:", event);
  if (event.reaction === "eyes") {
    try {
      await app.client.reactions.add({
        name: "loading2",
        channel: event.item.channel,
        timestamp: event.item.ts,
      });
      // get message text
      const messages = await app.client.conversations.history({
        channel: event.item.channel,
        oldest: event.item.ts,
        limit: 1,
        inclusive: true,
      });
      const message = messages.messages?.[0];
      if (!message)
        throw Error(`could not find message with ts ${event.item.ts}`);
      console.log(message.text);
      // find url in message like Recording: https://.../play.html?recording=data/xxx/2025-08-20T10:39:31.176948341Z.asciinema.jsonl
      // only match urls containing "play.html?recording=" (but any domain is fine)
      const foundUrl = message.text?.match(
        /https?:\/\/[^\s]+\/play\.html\?recording=[^\s]+/g
      );
      if (!foundUrl || foundUrl.length === 0) {
        throw Error(`could not find url in message: ${message.text}`);
      }
      let url = foundUrl[0];
      if (url.endsWith(">")) url = url.slice(0, -1); // remove trailing '>' if present
      console.log("found url:", url);
      const recordingUrl = new URL(url);
      const recordingPath = recordingUrl.searchParams.get("recording");
      if (!recordingPath) {
        throw Error(`could not find recording path in url: ${url}`);
      }
      console.log("recording path:", recordingPath);

      const summary = await summarizeAsciinema(config.opts, recordingPath);

      // send summary to the thread
      await say({
        markdown_text: `${summary.sessionInfo}\n\n${summary.summary}`,
        thread_ts: event.item.ts,
        reply_broadcast: true,
      });
    } catch (error) {
      console.error("Error processing session:", error);
      await say({
        text: `Sorry <@${
          event.user
        }>, I couldn't process this session: ${String(error)}`,
        thread_ts: event.item.ts,
      });
    } finally {
      await app.client.reactions.remove({
        name: "loading2",
        channel: event.item.channel,
        timestamp: event.item.ts,
      });
    }
  }
});
(async () => {
  // Start your app
  await app.start();

  app.logger.info("⚡️ Bolt app is running!");
  /*app.client.chat.postMessage({
    channel: "C09C0GUGCN4",
    markdown_text: "helo",
  });*/
})();
