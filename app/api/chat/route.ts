import { NextResponse } from "next/server";
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions";
import { createAzureClient, getDeploymentName } from "@/lib/copilot/azureClient";
import { buildTradeProposal } from "@/lib/copilot/buildTradeProposal";
import { runReadTool, summarizeReadResult } from "@/lib/copilot/runReadTool";
import { isSafeWriteTool, runWriteTool } from "@/lib/copilot/runWriteTool";
import { COPILOT_SYSTEM_PROMPT } from "@/lib/copilot/systemPrompt";
import { READ_TOOL_NAMES, copilotTools } from "@/lib/copilot/toolDefinitions";
import type { ReadToolName } from "@/lib/copilot/toolDefinitions";
import type { ChatMessage, ToolCallRecord } from "@/types/copilot";
import { getMockPortfolio } from "@/lib/mock/mockPortfolio";

/** How many times the model may read data before it has to answer. */
const MAX_TOOL_ROUNDS = 6;

function isReadTool(name: string): name is ReadToolName {
  return (READ_TOOL_NAMES as readonly string[]).includes(name);
}

/**
 * The copilot's turn.
 *
 * The model may loop through read tools freely. The moment it reaches for
 * proposeTrade the loop stops and a proposal is returned instead — nothing is
 * signed here, and this route has no way to sign anything even if it wanted to.
 */
export async function POST(request: Request) {
  const { messages } = (await request.json()) as {
    messages: { role: string; content: string }[];
  };

  let client;
  try {
    client = createAzureClient();
  } catch (error) {
    return NextResponse.json(
      { role: "assistant", text: (error as Error).message } satisfies Partial<ChatMessage>,
      { status: 200 }
    );
  }

  const conversation: ChatCompletionMessageParam[] = [
    { role: "system", content: COPILOT_SYSTEM_PROMPT },
    ...messages.map((message) => ({
      role: message.role === "user" ? ("user" as const) : ("assistant" as const),
      content: message.content,
    })),
  ];

  const toolCallsMade: ToolCallRecord[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const completion = await client.chat.completions.create({
      model: getDeploymentName(),
      messages: conversation,
      tools: copilotTools,
      temperature: 0.2,
    });

    const reply = completion.choices[0]?.message;
    if (!reply) {
      break;
    }

    const requestedTools = reply.tool_calls ?? [];

    if (requestedTools.length === 0) {
      return NextResponse.json({
        role: "assistant",
        text: reply.content ?? "",
        toolCalls: toolCallsMade,
      } satisfies Partial<ChatMessage>);
    }

    conversation.push(reply);

    for (const toolCall of requestedTools as ChatCompletionMessageToolCall[]) {
      if (toolCall.type !== "function") {
        continue;
      }

      const toolName = toolCall.function.name;
      const toolArguments = JSON.parse(toolCall.function.arguments || "{}");

      if (toolName === "proposeTrade") {
        const portfolio = getMockPortfolio();
        const proposal = buildTradeProposal({
          marketId: toolArguments.marketId,
          side: toolArguments.side,
          contracts: toolArguments.contracts,
          availableUsdc: portfolio.realizedUsdcLastWeek + 100,
        });

        toolCallsMade.push({ name: toolName, status: proposal ? "finished" : "failed" });

        return NextResponse.json({
          role: "assistant",
          text: proposal
            ? toolArguments.reasoning
            : "I could not find that market. Ask me to list what is open.",
          toolCalls: toolCallsMade,
          proposal: proposal ?? undefined,
          proposalOutcome: proposal ? "pending" : undefined,
        } satisfies Partial<ChatMessage>);
      }

      if (isSafeWriteTool(toolName)) {
        const outcome = runWriteTool(
          toolName as Parameters<typeof runWriteTool>[0],
          toolArguments
        );
        toolCallsMade.push({
          name: toolName,
          status: "finished",
          summary: outcome.summary,
        });
        conversation.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(outcome.detail),
        });
        continue;
      }

      if (isReadTool(toolName)) {
        const result = runReadTool(toolName, toolArguments);
        toolCallsMade.push({
          name: toolName,
          status: "finished",
          summary: summarizeReadResult(toolName, result),
        });
        conversation.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
        continue;
      }

      toolCallsMade.push({ name: toolName, status: "failed" });
      conversation.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify({ error: `Unknown tool: ${toolName}` }),
      });
    }
  }

  return NextResponse.json({
    role: "assistant",
    text: "I read as much as I could but could not settle on an answer. Try asking something narrower.",
    toolCalls: toolCallsMade,
  } satisfies Partial<ChatMessage>);
}
