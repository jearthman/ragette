import LoaderFactory from "./loader-factory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";

const pc = new Pinecone();

/**
 * Vectorizes a file by splitting it into documents, embedding the documents using OpenAI, and storing the embeddings in Pinecone.
 *
 * @param file - The file to vectorize.
 * @param fileId - The ID of the file.
 * @returns A promise that resolves to "DOCUMENT_STORED" when the vectorization and storage process is complete.
 * @throws If an error occurs during the vectorization and storage process.
 */
export default async function vectorizeFile(file: Blob, fileId: string) {
  try {
    // Load the file using the appropriate loader.
    const loader = await LoaderFactory(file);
    console.log("Loading returned: ", typeof loader);

    // Split the file into documents.
    const docs = await loader.load();
    console.log("Docs loaded: ", JSON.stringify(docs));

    // Split the documents into smaller chunks of text.
    const splitter = new RecursiveCharacterTextSplitter();
    const splitDocs = await splitter.splitDocuments(docs);

    console.log("Docs split: ", JSON.stringify(splitDocs));

    // Extract the text strings from the documents.
    const splitStrings = splitDocs.map((doc) => doc.pageContent);

    // Embed the documents using OpenAI.
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

    // Store the document embeddings in Pinecone.
    const pineconeRecords: PineconeRecord[] = documentEmbeddings.map(
      (documentEmbedding, index) => ({
        id: `${fileId}-${index}`,
        values: documentEmbedding,
        metadata: {
          text: splitStrings[index],
        },
      }),
    );

    // Split the records into smaller batches to avoid exceeding the Pinecone API's payload size limit.
    const pineconeBatches = chunkArray(pineconeRecords, 100);
    console.log("PINECONE RECORDS LENGTH: ", pineconeBatches.length);

    // Store the batches in Pinecone.
    const namespace = pc.index("ragette").namespace(fileId);
    const batchReq = pineconeBatches.map((batch) => {
      return namespace.upsert(batch);
    });

    // Wait for all the batches to be stored.
    const batchRes = await Promise.all(batchReq);
    console.log("Inserted: ", batchRes);

    return "DOCUMENT_STORED";
  } catch (error) {
    console.log("Error: ", error);
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
function chunkArray(
  arr: PineconeRecord[],
  chunkSize: number,
): PineconeRecord[][] {
  return arr.reduce((chunks: PineconeRecord[][], elem, index) => {
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
