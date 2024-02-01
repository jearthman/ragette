import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { AstraDB } from "@datastax/astra-db-ts";
import { OpenAIEmbeddings } from "@langchain/openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const { ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_API_ENDPOINT } = process.env;

export async function POST(req: Request) {
  console.log("POST function called");

  const { messages, fileId } = await req.json();
  console.log(
    `Received messages: ${JSON.stringify(messages)}, fileId: ${fileId}`,
  );

  const lastUserMessage = messages[messages.length - 1];
  const embeddings = new OpenAIEmbeddings();
  const metadataFilter = { fileId: fileId };
  const embeddedQuery = await embeddings.embedQuery(lastUserMessage.content);
  console.log(`Embedded query: ${embeddedQuery}`);

  const options = {
    sort: {
      $vector: embeddedQuery,
    },
    limit: 5,
  };

  const db = new AstraDB(ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_API_ENDPOINT);
  const collection = await db.collection("ragette_cosine");
  console.log(`Collection: ${JSON.stringify(collection)}`);
  const cursor = await collection.find(metadataFilter, options);
  console.log(`Cursor: ${JSON.stringify(cursor)}`);
  const retrievedDocs = await cursor.toArray();
  console.log(`Retrieved documents: ${retrievedDocs}`);

  const context = retrievedDocs.map((doc) => doc.text).join("\n");

  const systemPrompt = {
    role: "system",
    content:
      "You are a helpful AI that uses Retrieval Augmented Generation to answer questions. Please use only the Markdown markup language to format your response, not plain text. If the user asks or infers a question before any newline characters please use the provided document context appended to the message to answer. If no context is found, say something along the lines of 'I couldn't find information about that from your document'",
  };

  messages[messages.length - 1].content +=
    `\n\nSTART CONTEXT\n${context}\nEND CONTEXT`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-0125-preview",
    stream: true,
    messages: [systemPrompt, ...messages],
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
