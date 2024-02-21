import LoaderFactory from "./loader-factory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { AstraDB } from "@datastax/astra-db-ts";
import { OpenAIEmbeddings } from "@langchain/openai";

const { ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_API_ENDPOINT } = process.env;

type AstraDoc = {
  fileId: string;
  text: string;
  $vector: number[];
};

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
      // verbose: true,
    });

    console.log("Starting Embedding");

    const documentEmbeddings = await embeddings.embedDocuments(splitStrings);

    // console.log("Document embeddings: ", JSON.stringify(documentEmbeddings));

    const astraDocs: AstraDoc[] = splitStrings.map((splitString, index) => ({
      fileId: fileId,
      text: splitString,
      $vector: documentEmbeddings[index],
    }));

    // console.log("Astra docs: ", JSON.stringify(astraDocs));

    console.log("Inserting into Astra");

    const db = new AstraDB(ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_API_ENDPOINT);

    const collection = await db.collection("ragette_cosine");

    const batches = chunkArray(astraDocs, 20);

    const batchesReq = batches.map((batch) => {
      return collection.insertMany(batch);
    });

    const res = await Promise.all(batchesReq);

    console.log("Inserted: ", res);

    return "DOCUMENT_STORED";
  } catch (error) {
    throw error;
  }
}

/**
 * Chunk an array into smaller arrays of a specified size.
 *
 * @param arr - The array to be chunked.
 * @param chunkSize - The size of each chunk.
 * @returns An array of smaller arrays, each containing elements from the original array.
 */
function chunkArray(arr: AstraDoc[], chunkSize: number): AstraDoc[][] {
  return arr.reduce((chunks: AstraDoc[][], elem, index) => {
    // Calculate the index of the chunk that the current element should be placed in.
    const chunkIndex = Math.floor(index / chunkSize);
    // Create the chunk if it doesn't exist.
    if (!chunks[chunkIndex]) {
      chunks[chunkIndex] = [];
    }
    // Add the element to the chunk.
    chunks[chunkIndex].push(elem);
    return chunks;
  }, []);
}
