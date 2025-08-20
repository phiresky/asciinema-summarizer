import { readFileSync } from "fs";
import type { AsciinemaHeader, AsciinemaEvent, ParseResult } from "./types.ts";

export function parseAsciinemaFile(content: string): ParseResult {
  const lines = content.split("\n").filter((line) => line.trim());

  if (lines.length === 0) {
    throw new Error("File is empty");
  }

  // Parse header from first line
  const header: AsciinemaHeader = JSON.parse(lines[0]);

  const outputLines: string[] = [];
  let lastTimestamp = 0;

  // Process events from remaining lines
  for (let i = 1; i < lines.length; i++) {
    try {
      const event: AsciinemaEvent = JSON.parse(lines[i]);

      if (event.length >= 3) {
        const timestamp = Number(event[0]);
        const eventType = event[1];
        const data = event[2];

        // Track the highest timestamp for duration calculation
        lastTimestamp = Math.max(lastTimestamp, timestamp);

        // Collect output events
        if (eventType === "o") {
          outputLines.push(data);
        }
      }
    } catch (parseError) {
      // Skip malformed event lines
      console.warn(`Skipping malformed line ${i + 1}: ${lines[i]}`);
      continue;
    }
  }

  return {
    header,
    outputLines,
    duration: lastTimestamp,
  };
}
