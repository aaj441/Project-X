# AI Rules and Guidelines

This document outlines the AI tech stack used in the application and provides clear rules for leveraging AI capabilities.

## AI Tech Stack

*   **Vercel AI SDK (`ai`):** The primary library for interacting with various AI models.
*   **OpenAI SDK (`@ai-sdk/openai`):** Used for accessing OpenAI models like `gpt-4o`, `dall-e-3`.
*   **OpenRouter AI SDK (`@openrouter/ai-sdk-provider`):** Used for accessing models via OpenRouter, often including OpenAI models through their API.
*   **Anthropic AI SDK (`@ai-sdk/anthropic`):** For Anthropic models like `claude-3-7-sonnet-latest`.
*   **Google AI SDK (`@ai-sdk/google`):** For Google models like `gemini-2.5-pro-preview-05-06`.
*   **Deepseek AI SDK (`@ai-sdk/deepseek`):** For Deepseek models like `deepseek-reasoner`.
*   **Environment Variables:** API keys for AI providers are managed via `.env` (e.g., `OPENROUTER_API_KEY`, `OPENAI_API_KEY`).
*   **AI Credits System:** All AI operations consume user-specific AI credits, managed server-side.

## Rules for AI Library Usage

When implementing AI features, adhere to the following guidelines:

*   **Model Configuration:**
    *   Always import model providers from their respective packages (e.g., `openai` from `@ai-sdk/openai`, `createOpenRouter` from `@openrouter/ai-sdk-provider`).
    *   Check `.env` for available API keys to determine which provider to use.
    *   If unsure, start with `openai("gpt-4o")` or `openrouter("openai/gpt-4o")` if an OpenRouter key is available.
    *   Do not hardcode API keys; they are automatically pulled from environment variables.

*   **Generating Text (`generateText`):**
    *   Use `generateText` for non-interactive text generation (e.g., drafting emails, summarizing, generating outlines).
    *   Pass `model` and `prompt` (or `messages` array) as parameters.
    *   Consider using `system` prompts for defining the AI's persona or specific instructions.

*   **Generating Structured Objects (`generateObject`):**
    *   Use `generateObject` when you need the AI to return data in a specific, structured format.
    *   Define the output structure using a `Zod` schema and pass it to the `schema` parameter.
    *   Can be used to generate single objects, arrays of objects (with `output: "array"`), or enum values (with `output: "enum"`).

*   **Streaming Text (`streamText`):**
    *   Use `streamText` for interactive use cases like chat bots or real-time content generation where you want to display text as it's being generated.
    *   Iterate over `textStream` to process chunks of text.

*   **Generating Images (`experimental_generateImage`):**
    *   Always import as `experimental_generateImage` (not just `generateImage`).
    *   Use `openai.image("dall-e-3")` or `openai.image("gpt-image-1")` for image generation.
    *   Specify `prompt` and optionally `size` or `aspectRatio`.
    *   Image data can be accessed via `image.base64` or `image.uint8Array`.

*   **Tool Calling (`tool`):**
    *   Use the `tool` function from `ai` to define tools that the AI can use to perform actions (e.g., fetching external data).
    *   Define `description`, `parameters` (with Zod schema), and an `execute` function for each tool.

*   **Credit Consumption:**
    *   All AI operations must integrate with the server-side `checkAndConsumeAICredits` utility to ensure proper credit deduction.
    *   Be mindful of the credit cost for different AI operations (e.g., image generation is typically more expensive).

*   **Error Handling:**
    *   Implement robust error handling for AI calls, providing user-friendly feedback via `react-hot-toast`.
    *   Catch and log AI service errors gracefully.