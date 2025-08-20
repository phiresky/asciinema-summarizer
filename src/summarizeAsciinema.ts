import { cleanTerminalOutput } from "./cleaner.ts";
import { queryOllama } from "./ollama.ts";
import { parseAsciinemaFile } from "./parser.ts";
import type { CliOptions } from "./types.ts";
import { promisify } from "node:util";
import child_process, { execFile, spawn } from "node:child_process";
import { Readable, type WritableOptions } from "node:stream";
import { Writable } from "node:stream";
import { StringDecoder } from "node:string_decoder";
import { text } from "node:stream/consumers";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const execFileAsync = promisify(execFile);
export async function summarizeAsciinema(opts: CliOptions, filePath: string) {
  const fileContent = await readFile(filePath, "utf-8");
  // Parse the asciinema file
  const { header, outputLines, duration } = parseAsciinemaFile(fileContent);

  // Display basic info
  console.log("Session info:");
  if (duration > 0) {
    console.log(`  Duration: ${duration.toFixed(1)} seconds`);
  } else {
    console.log("  Duration: unknown");
  }
  console.log(
    `  Terminal size: ${header.width || "?"}x${header.height || "?"}`
  );
  console.log();
  const sessionInfo = `Session: ${basename(filePath)}\nDuration: ${
    duration > 0 ? `${duration.toFixed(1)} seconds` : "unknown"
  }\nTerminal size: ${header.width || "?"}x${header.height || "?"}`;

  // Clean the output
  let cleanText;
  if (opts.converter === "cleaner")
    cleanText = cleanTerminalOutput(outputLines);
  else if (opts.converter === "asciinema-convert") {
    const txtPath = filePath + ".txt";
    // start child_process args: asciinema convert - -
    const subproc = await execFileAsync("asciinema", [
      "convert",
      filePath,
      txtPath,
      "-f",
      "txt",
      "--overwrite",
    ]);
    if (subproc.stderr) {
      console.error("Error during asciinema conversion:", subproc.stderr);
    }
    cleanText = await readFile(txtPath, "utf-8");
  } else {
    throw Error(
      `Unknown converter option: ${opts.converter}. Supported options are 'cleaner' and 'asciinema-convert'.`
    );
  }

  if (!cleanText.trim()) {
    throw Error("Warning: No meaningful output found in the session");
  }

  console.log(`Extracted ${cleanText.length} characters of terminal output`);

  if (opts.showOutput) {
    console.log("\n" + "=".repeat(50));
    console.log("CLEANED TERMINAL OUTPUT:");
    console.log("=".repeat(50));
    console.log(cleanText);
    console.log("=".repeat(50) + "\n");
  }

  // Query Ollama for summary
  const summary = await queryOllama(
    cleanText,
    opts.model,
    opts.host,
    opts.port,
    opts.enableThinking
  );
  return { summary, sessionInfo, header, duration };
}
