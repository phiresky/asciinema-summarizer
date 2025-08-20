import type { OllamaRequest, OllamaStreamChunk } from "./types.ts";
import { Agent, setGlobalDispatcher } from "undici";
setGlobalDispatcher(
  new Agent({
    headersTimeout: 60 * 60_000,
  })
);
export async function queryOllama(
  text: string,
  model: string,
  host: string = "localhost",
  port: number = 11434,
  enableThinking: boolean = true
): Promise<string> {
  const url = `http://${host}:${port}/api/generate`;

  const prompt = `Below is a SSH session transcript to production infrastructure.
Please analyze this terminal session output and provide a concise summary of what was done.
If anything security-critical was done or this might be someone trying to exploit or exfiltrate data, mention it.
Do not include any sensitive data such as API keys or passwords in the response.
The summary can use bullet points or a numbered list, but should be a maximum of 10 sentences.

${text}

Summary of this SSH session:`;

  const payload: OllamaRequest = {
    model,
    prompt,
    stream: true,
    think: enableThinking,
    options: {
      num_ctx: 160_000, // 262144 is max but not fit in 64gb mem,
      // Using defaults - can be uncommented/modified as needed
      // temperature: 0.3,
      // top_p: 0.9,
      // max_tokens: 500
    },
  };

  try {
    console.log("Connecting to Ollama server...");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response body received");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let fullResponse = "";
    let thinkingOutput = "";
    let tokensReceived = 0;
    let thinkingActive = false;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data: OllamaStreamChunk = JSON.parse(line);

            // Handle thinking output for thinking models
            const thinkingToken = data.thinking;
            if (thinkingToken) {
              if (!thinkingActive) {
                console.log("THINKING:");
                console.log("-".repeat(40));
                thinkingActive = true;
              }
              thinkingOutput += thinkingToken;
              process.stdout.write(thinkingToken);
            }

            // Get the response token (actual output)
            const token = data.response;
            if (token) {
              if (thinkingActive) {
                console.log("\n\nSUMMARY:");
                console.log("-".repeat(40));
                thinkingActive = false;
              } else if (!fullResponse && !thinkingActive) {
                // No thinking output, show summary header
                console.log("SUMMARY:");
                console.log("-".repeat(40));
              }

              fullResponse += token;
              tokensReceived += 1;

              // Output token immediately
              process.stdout.write(token);
            }

            // Check if this is the final chunk
            if (data.done) {
              console.log(
                `\n\n[Completed - ${tokensReceived} response tokens received]`
              );
              if (thinkingOutput) {
                console.log(
                  `[Thinking tokens: ${thinkingOutput.length} characters]`
                );
              }
              break;
            }
          } catch (parseError) {
            // Skip malformed JSON chunks
            continue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!fullResponse) {
      console.log("No response received from Ollama");
      return "";
    }

    return fullResponse.trim();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw Error(
        `Error: Could not connect to Ollama server at ${host}:${port}`,
        { cause: error }
      );
    } else if (error instanceof Error) {
      throw Error(`\nError communicating with Ollama: ${error.message}`, {
        cause: error,
      });
    } else {
      throw error;
    }
  }
}
