import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { AstraDB } from "@datastax/astra-db-ts";
import { OpenAIEmbeddings } from "@langchain/openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const { ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_API_ENDPOINT } = process.env;

export async function POST(req: Request) {
  const { messages, fileId } = await req.json();

  const lastUserMessage = messages[messages.length - 1];
  const embeddings = new OpenAIEmbeddings();
  const metadataFilter = { fileId: fileId };
  const embeddedQuery = await embeddings.embedQuery(lastUserMessage.content);
  const options = {
    sort: {
      $vector: embeddedQuery,
    },
    limit: 5,
  };

  const db = new AstraDB(ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_API_ENDPOINT);
  const collection = await db.collection("ragette_cosine");
  const cursor = await collection.find(metadataFilter, options);
  const retrievedDocs = await cursor.toArray();
  const context = retrievedDocs.map((doc) => doc.text).join("\n");

  const systemPrompt = {
    role: "system",
    content:
      "You are a helpful AI that uses Retrieval Augmented Generation to answer questions. If context is found based on a user's question it will be appended to the user's message. If no context is found, say something along the lines of 'I couldn't find information about that'",
  };

  messages[messages.length - 1].content +=
    `\n\nSTART CONTEXT\n${context}\nEND CONTEXT`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    stream: true,
    messages: [systemPrompt, ...messages],
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
