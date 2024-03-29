import LoaderFactory from "./loader-factory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";

const pc = new Pinecone();

type VectorizeRes = {
  status: string;
  progress?: number;
};

/**
 * Vectorizes a file by splitting it into documents, embedding the documents using OpenAI, and storing the embeddings in Pinecone.
 *
 * @param file - The file to vectorize.
 * @param fileId - The ID of the file.
 * @returns A promise that resolves to "DOCUMENT_STORED" when the vectorization and storage process is complete.
 * @throws If an error occurs during the vectorization and storage process.
 */
export default async function* vectorizeFile(
  file: Blob,
  fileId: string,
): AsyncGenerator<String, String, null> {
  try {
    // Load the file using the appropriate loader.
    const loader = await LoaderFactory(file);
    console.log("Loading returned: ", typeof loader);

    // Split the file into documents.
    const docs = await loader.load();
    console.log("METADATA EXAMPLE: ", JSON.stringify(docs[0].metadata));
    console.log("Docs loaded: ", JSON.stringify(docs.length));

    // Split the documents into smaller chunks of text.
    const splitter = new RecursiveCharacterTextSplitter();
    const splitDocs = await splitter.splitDocuments(docs);

    console.log("Docs split: ", JSON.stringify(splitDocs.length));

    // Extract the text strings from the documents.
    const splitStrings = splitDocs.map((doc) => doc.pageContent);

    // Embed the documents using OpenAI.
    const embeddings = new OpenAIEmbeddings({
      modelName: "text-embedding-3-small",
      maxConcurrency: 10,
      verbose: true,
    });

    yield "STARTING_EMBEDDING";
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

    // Split the records into smaller batches
    const pineconeBatches = chunkArray(pineconeRecords, 100);
    console.log("PINECONE RECORDS LENGTH: ", pineconeBatches.length);

    // Store the batches in Pinecone
    let completeBatchCount = 0;
    const namespace = pc.index("ragette").namespace(fileId);
    pineconeBatches.map((batch) => {
      return namespace.upsert(batch).then(() => {
        completeBatchCount++;
      });
    });

    // yield progress of completed promises to the client
    while (completeBatchCount < pineconeBatches.length) {
      yield "DOCUMENT_UPLOADING:" +
        Math.floor((completeBatchCount / pineconeBatches.length) * 100);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Wait for all the batches to be stored.
    // const batchRes = await Promise.all(batchReq);

    console.log("Inserted");

    //remove document from blob storage

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
