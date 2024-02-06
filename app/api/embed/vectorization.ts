import LoaderFactory from "./loader-factory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { AstraDB } from "@datastax/astra-db-ts";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";

const pc = new Pinecone();

export default async function vectorizeFile(file: Blob, fileId: string) {
  try {
    const loader = await LoaderFactory(file);

    console.log("Loading returned: ", typeof loader);

    const docs = await loader.load();

    console.log("Docs loaded: ", JSON.stringify(docs));

    const splitter = new RecursiveCharacterTextSplitter();

    const splitDocs = await splitter.splitDocuments(docs);

    console.log("Docs split: ", JSON.stringify(splitDocs));

    const splitStrings = splitDocs.map((doc) => doc.pageContent);

    const embeddings = new OpenAIEmbeddings({
      modelName: "text-embedding-3-small",
      maxConcurrency: 10,
      verbose: true,
    });

    console.log("Starting Embedding");

    const documentEmbeddings = await embeddings.embedDocuments(splitStrings);

    console.log(
      "Document embeddings count: ",
      `${documentEmbeddings.length}/${splitStrings.length}`,
    );

    const pineconeRecords: PineconeRecord[] = documentEmbeddings.map(
      (documentEmbedding, index) => ({
        id: `${fileId}-${index}`,
        values: documentEmbedding,
        metadata: {
          text: splitStrings[index],
        },
      }),
    );

    const pineconeBatches = chunkArray(pineconeRecords, 100);

    console.log("PINECONE RECORDS LENGTH: ", pineconeBatches.length);

    const namespace = pc.index("ragette").namespace(fileId);

    const batchReq = pineconeBatches.map(async (batch) => {
      const res = await namespace.upsert(batch);
      return res;
    });

    const batchRes = await Promise.all(batchReq);

    console.log("Inserted: ", batchRes);

    return "DOCUMENT_STORED";
  } catch (error) {
    console.log("Error: ", error);
    throw error;
  }
}

function chunkArray(
  arr: PineconeRecord[],
  chunkSize: number,
): PineconeRecord[][] {
  return arr.reduce((chunks: PineconeRecord[][], elem, index) => {
    const chunkIndex = Math.floor(index / chunkSize);
    if (!chunks[chunkIndex]) {
      chunks[chunkIndex] = [];
    }
    chunks[chunkIndex].push(elem);
    return chunks;
  }, []);
}
