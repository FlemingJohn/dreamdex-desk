import { AzureOpenAI } from "openai";

/**
 * The Azure OpenAI client, created on the server only.
 *
 * The API key lives in .env.local and must never reach the browser, which is
 * why every copilot request goes through a route handler instead of being
 * called from a component.
 */
export function createAzureClient(): AzureOpenAI {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiVersion = process.env.AZURE_API_VERSION;

  if (!apiKey || !endpoint || !apiVersion) {
    throw new Error(
      "Azure OpenAI is not configured. Copy .env.example to .env.local and fill in the values."
    );
  }

  return new AzureOpenAI({ apiKey, endpoint, apiVersion });
}

export function getDeploymentName(): string {
  return process.env.AZURE_OPENAI_DEPLOYMENT_NAME ?? "gpt-4o";
}
