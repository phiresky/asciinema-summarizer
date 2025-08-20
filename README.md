# asciinema-summarizer

Summarize asciinema terminal sessions using Ollama AI models.

## Features

- Parse asciinema `.cast` files
- Clean terminal output (removes ANSI escape sequences, control characters)
- Generate AI-powered summaries using Ollama
- Support for thinking models with separated thinking/response output
- Security-focused analysis to detect potential exploits or data exfiltration
- Available in both Python and TypeScript implementations

## Installation

```bash
# Install dependencies
npm install

```

## Usage

```bash
node src/slack.ts
```

## Requirements

- Ollama server running locally or remotely
- Node.js 18+ (for TypeScript version)
