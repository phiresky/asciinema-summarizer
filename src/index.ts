#!/usr/bin/env node

import { Command } from "commander";
import type { CliOptions } from "./types.ts";
import { basename } from "path";
import { readFile } from "fs/promises";
import { summarizeAsciinema } from "./summarizeAsciinema.ts";

async function main() {
  const program = new Command();

  program
    .name("asciinema-summarizer")
    .description("Summarize asciinema terminal sessions using Ollama")
    .version("0.1.0")
    .argument("<file>", "Path to asciinema .cast file")
    .requiredOption("--model <model>", "Ollama model to use")
    .option("--host <host>", "Ollama server host", "localhost")
    .option("--port <port>", "Ollama server port", "11434")
    .option(
      "--show-output",
      "Show cleaned terminal output before summary",
      false
    )
    .option("--disable-thinking", "Disable thinking for thinking models", false)
    .option("--slack-webhook <url>", "Slack webhook URL to send summary")
    .action(
      async (
        file: string,
        options: Partial<CliOptions> & { disableThinking?: boolean }
      ) => {
        const opts: CliOptions = {
          model: options.model!,
          host: options.host || "localhost",
          port: parseInt(options.port?.toString() || "11434", 10),
          showOutput: options.showOutput || false,
          enableThinking: !options.disableThinking,
        };

        console.log(`Processing asciinema file: ${file}`);

        const content = await readFile(file, "utf-8");
        const summary = await summarizeAsciinema(opts, file, content);

        console.log("\nSUMMARY:");
        console.log(summary);
        console.log("\nSummary complete!");
      }
    );

  try {
    await program.parseAsync();
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Unknown error occurred");
    }
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}

export { main };
