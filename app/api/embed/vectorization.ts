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
      verbose: true,
    });

    console.log("Starting Embedding");

    const documentEmbeddings = await embeddings.embedDocuments(splitStrings);

    console.log(
      "Document embeddings count: ",
      `${documentEmbeddings.length}/${splitStrings.length}`,
    );

    const astraDocs: AstraDoc[] = splitStrings.map((splitString, index) => ({
      fileId: fileId,
      text: splitString,
      $vector: documentEmbeddings[index],
    }));

    const astraBatches = chunkArray(astraDocs, 20);

    console.log("ASTRA DOCS LENGTH: ", astraDocs.length);

    const db = new AstraDB(ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_API_ENDPOINT);

    const collection = await db.collection("ragette_cosine");

    const batchReq = astraBatches.map(async (batch) => {
      const res = await collection.insertMany(batch);
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

const chunkArray = (arr: AstraDoc[], chunkSize: number): AstraDoc[][] => {
  return arr.reduce((chunks: AstraDoc[][], elem, index) => {
    const chunkIndex = Math.floor(index / chunkSize);
    if (!chunks[chunkIndex]) {
      chunks[chunkIndex] = [];
    }
    chunks[chunkIndex].push(elem);
    return chunks;
  }, []);
};
