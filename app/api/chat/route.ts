import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { QuestionCheckPrompt } from "./prompt-templates";

const pc = new Pinecone();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  console.log("POST function called");

  const { messages, fileId } = await req.json();
  console.log(
    `Received messages: ${JSON.stringify(messages)}, fileId: ${fileId}`,
  );

  const lastUserMessage = messages[messages.length - 1];

  const questionCheckSystemMessage = {
    role: "system",
    content: QuestionCheckPrompt,
  };

  const questionCheckRes = await openai.chat.completions.create({
    model: "gpt-4-0125-preview",
    stream: false,
    messages: [questionCheckSystemMessage, lastUserMessage],
  });

  if (
    questionCheckRes.choices.pop()?.message.content?.toLowerCase() === "yes"
  ) {
    const embeddings = new OpenAIEmbeddings();

    const embeddedQuery = await embeddings.embedQuery(lastUserMessage.content);
    console.log(`Embedded query: ${embeddedQuery}`);

    const namespace = pc.index("ragette").namespace(fileId);
    const queryRes = await namespace.query({
      topK: 5,
      vector: embeddedQuery,
      includeMetadata: true,
    });
    console.log(`Query Res: ${JSON.stringify(queryRes)}`);
    const context = queryRes.matches
      .map((record) => record.metadata?.text)
      .join("\n");
    console.log(`Retrieved documents: ${context}`);

    messages[messages.length - 1].content +=
      `\n\nSTART CONTEXT\n${context}\nEND CONTEXT`;
  }

  const systemPrompt = {
    role: "system",
    content:
      "You are a helpful AI that uses Retrieval Augmented Generation to answer questions. Please use only the Markdown markup language to format your response, not plain text. If the user asks or infers a question before any newline characters please use the provided document context appended to the message to answer. If no context is found, say something along the lines of 'I couldn't find information about that from your document' but try to answer their question.",
  };

  const response = await openai.chat.completions.create({
    model: "gpt-4-0125-preview",
    stream: true,
    messages: [systemPrompt, ...messages],
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
