#!/usr/bin/env node

export interface AsciinemaHeader {
  version: number;
  width: number;
  height: number;
  timestamp?: number;
  title?: string;
  env?: Record<string, string>;
  [key: string]: unknown;
}

export type AsciinemaEvent = [number, string, string];

export interface AsciinemaFile {
  header: AsciinemaHeader;
  events: AsciinemaEvent[];
}

export interface ParseResult {
  header: AsciinemaHeader;
  outputLines: string[];
  duration: number;
}

export interface OllamaOptions {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  num_ctx?: number;
}

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream: boolean;
  think?: boolean;
  options?: OllamaOptions;
}

export interface OllamaStreamChunk {
  model?: string;
  created_at?: string;
  response?: string;
  thinking?: string;
  done?: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface CliOptions {
  model: string;
  host: string;
  port: number;
  showOutput: boolean;
  enableThinking: boolean;
  converter: "cleaner" | "asciinema-convert";
}
