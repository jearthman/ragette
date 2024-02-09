import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { QuestionCheckPrompt, SystemPrompt } from "./prompt-templates";

const pc = new Pinecone();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Handles the POST request for the chat route.
 *
 * @param req - The request object.
 * @returns A streaming text response.
 */
export async function POST(req: Request) {
  console.log("POST function called");

  const { messages, fileId } = await req.json();
  console.log(
    `Received messages: ${JSON.stringify(messages)}, fileId: ${fileId}`,
  );

  const lastUserMessage = messages[messages.length - 1];

  // Check if the user asked or infered a question before retrieval augmented generation.
  const questionCheckSystemMessage = {
    role: "system",
    content: QuestionCheckPrompt,
  };
  const questionCheckRes = await openai.chat.completions.create({
    model: "gpt-4-0125-preview",
    stream: false,
    messages: [questionCheckSystemMessage, lastUserMessage],
  });

  let context = "";

  if (
    questionCheckRes.choices.pop()?.message.content?.toLowerCase() === "yes"
  ) {
    // Embed the user query using OpenAI.
    const embeddings = new OpenAIEmbeddings();
    const embeddedQuery = await embeddings.embedQuery(lastUserMessage.content);
    console.log(`Embedded query: ${embeddedQuery}`);

    // Query Pinecone for the most relevant documents.
    const namespace = pc.index("ragette").namespace(fileId);
    const queryRes = await namespace.query({
      topK: 10,
      vector: embeddedQuery,
      includeMetadata: true,
    });
    console.log(`Query Res: ${JSON.stringify(queryRes)}`);
    // Extract the context from the most relevant documents.
    context = queryRes.matches
      .map((record) => record.metadata?.text)
      .join("\n");
    console.log(`Retrieved documents: ${context}`);
  }

  // Format the system prompt with the context.
  const systemContent = await SystemPrompt.format({ context: context });
  const systemPrompt = {
    role: "system",
    content: systemContent,
  };

  // Generate a response using OpenAI.
  const response = await openai.chat.completions.create({
    model: "gpt-4-0125-preview",
    stream: true,
    messages: [systemPrompt, ...messages],
  });

  // Return the response as a streaming text response.
  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
