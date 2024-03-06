import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { GradingPrompt, TransformPrompt } from "./prompt-templates";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { kv } from "@vercel/kv";

const pc = new Pinecone();

// NODES

export async function retrieve(state) {
  try {
    let { question, fileId, retryCount } = state;

    kv.set(`file_status:${fileId}`, "Reading file");

    if (!retryCount) {
      retryCount = 1;
    } else {
      retryCount++;
    }

    const embeddings = new OpenAIEmbeddings();
    const embeddedQuery = await embeddings.embedQuery(question);
    console.log(`Embedded query`);

    // Query Pinecone for the most relevant documents.
    const namespace = pc.index("ragette").namespace(fileId);
    const queryRes = await namespace.query({
      topK: 5,
      vector: embeddedQuery,
      includeMetadata: true,
    });
    console.log(`Query Res`);
    // Extract the context from the most relevant documents.
    const docs = queryRes.matches
      .map((record) =>
        record.metadata && record.metadata.text
          ? record.metadata.text.toString()
          : "",
      )
      .filter((text) => text.length > 0);

    return {
      ...state,
      docs: docs,
      retryCount: retryCount,
    };
  } catch (error) {
    console.log(error);
  }
}

export async function grade(state) {
  try {
    const { question, docs, fileId } = state;

    kv.set(`file_status:${fileId}`, "Getting useful info");

    // const grade = z.object({
    //   binary_score: z
    //     .string()
    //     .refine((value) => value === "yes" || value === "no", {
    //       message: "Relevance score must be 'yes' or 'no'",
    //     }),
    // });

    // const tool = new DynamicStructuredTool({
    //   name: "relevance-check",
    //   description: "Binary score for relevance check",
    //   schema: grade,
    //   func: async ({ binary_score }) => {
    //     return binary_score;
    //   },
    // });

    const model = new ChatOpenAI({
      temperature: 0,
      modelName: "gpt-4-0125-preview",
      streaming: true,
    });

    // const gradingTool = convertToOpenAITool(tool);

    // const llmWithTool = model.bind({ tools: [gradingTool] });

    const prompt = GradingPrompt;

    const chain = prompt.pipe(model);

    const filteredDocs = [];
    let promiseCount = 0;

    docs.map((doc) => {
      chain
        .invoke({
          context: doc,
          question: question,
        })
        .then((result) => {
          promiseCount++;
          const grade = result.content.toLowerCase();
          if (grade === "yes") {
            console.log("RELEVANT DOC FOUND: ", doc);
            filteredDocs.push(doc);
            return;
          }
        });
    });

    while (promiseCount < docs.length) {
      if (filteredDocs.length > 0) {
        return {
          ...state,
          docs: filteredDocs,
          tramsformQuery: false,
        };
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return {
      ...state,
      docs: filteredDocs,
      tramsformQuery: filteredDocs.length === 0,
    };
  } catch (error) {
    console.log(error);
  }
}

export async function transformQuery(state) {
  try {
    const { question, fileId } = state;

    kv.set(`file_status:${fileId}`, "Re-evaluating question");

    const prompt = TransformPrompt;

    const model = new ChatOpenAI({
      temperature: 0,
      modelName: "gpt-4-0125-preview",
      streaming: true,
    });

    const outputParser = new StringOutputParser();

    const chain = prompt.pipe(model).pipe(outputParser);

    const betterQuestion = await chain.invoke({ question: question });

    return {
      ...state,
      question: betterQuestion,
    };
  } catch (error) {
    console.log(error);
  }
}

export async function webSearch(state) {
  try {
    const { question, docs, fileId } = state;

    kv.set(`file_status:${fileId}`, "Searching the web");

    const tool = new TavilySearchResults({ maxResults: 1 });

    const webDoc = await tool.invoke(question);

    docs.push(webDoc);

    return {
      ...state,
      docs: docs,
    };
  } catch (error) {
    console.log(error);
  }
}

// EDGES

export function decideToChat(state) {
  try {
    if (state.tramsformQuery) {
      return "transform_query";
    } else {
      return "end";
    }
  } catch (error) {
    console.log(error);
  }
}

export function decideToRetrieve(state) {
  try {
    if (state.retryCount >= 1) {
      return "web_search";
    }

    return "retrieve";
  } catch (error) {
    console.log(error);
  }
}
