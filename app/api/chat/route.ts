import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { Pinecone } from "@pinecone-database/pinecone";
import { QuestionCheckPrompt, SystemPrompt } from "./prompt-templates";
import { StateGraph, END } from "@langchain/langgraph";
import * as nodes from "./nodes";
import { kv } from "@vercel/kv";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ragState = {
  question: {
    value: (x: string, y: string) => (x = y),
    default: () => "",
  },
  docs: {
    value: (x: string[], y: string[]) => (x = y),
    default: () => [],
  },
  fileId: {
    value: (x: string, y: string) => (x = y),
    default: () => "",
  },
  retryCount: {
    value: (x: number, y: number) => (x = y),
    default: () => 0,
  },
  tramsformQuery: {
    value: (x: boolean, y: boolean) => (x = y),
    default: () => false,
  },
};

/**
 * Handles the POST request for the chat route.
 *
 * @param req - The request object.
 * @returns A streaming text response.
 */
export async function POST(req: Request) {
  console.log("chat POST function called");

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
    // // Embed the user query using OpenAI.
    // const embeddings = new OpenAIEmbeddings();
    // const embeddedQuery = await embeddings.embedQuery(lastUserMessage.content);
    // console.log(`Embedded query: ${embeddedQuery}`);

    // // Query Pinecone for the most relevant documents.
    // const namespace = pc.index("ragette").namespace(fileId);
    // const queryRes = await namespace.query({
    //   topK: 10,
    //   vector: embeddedQuery,
    //   includeMetadata: true,
    // });
    // console.log(`Query Res: ${JSON.stringify(queryRes)}`);
    // // Extract the context from the most relevant documents.
    // context = queryRes.matches
    //   .map((record) => record.metadata?.text)
    //   .join("\n");
    // console.log(`Retrieved documents: ${context}`);

    //new stuff for langgraph
    const app = createGraph();

    const inputs = {
      question: lastUserMessage.content,
      fileId: fileId,
    };

    const result = await app?.invoke(inputs);

    context = result.docs.join("\n");
    kv.set("file_status:" + fileId, "Done");
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

function createGraph() {
  try {
    const graph = new StateGraph({
      channels: ragState,
    });

    // Define Nodes
    graph.addNode("retrieve", nodes.retrieve);
    graph.addNode("grade", nodes.grade);
    graph.addNode("transform_query", nodes.transformQuery);
    graph.addNode("web_search", nodes.webSearch);

    // Build graph with directional edges
    graph.setEntryPoint("retrieve");
    graph.addEdge("retrieve", "grade");
    graph.addConditionalEdges("grade", nodes.decideToChat, {
      transform_query: "transform_query",
      end: END,
    });
    graph.addConditionalEdges("transform_query", nodes.decideToRetrieve, {
      retrieve: "retrieve",
      web_search: "web_search",
    });
    graph.addEdge("web_search", END);

    const app = graph.compile();

    return app;
  } catch (e) {
    console.error(e);
  }
}
