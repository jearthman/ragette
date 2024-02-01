import LoaderFactory from "./loader-factory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { AstraDB } from "@datastax/astra-db-ts";
import { OpenAIEmbeddings } from "@langchain/openai";

const { ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_API_ENDPOINT } = process.env;

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

    // for each string in

    const documentEmbeddings = await embeddings.embedDocuments(splitStrings);

    console.log("Document embeddings: ", JSON.stringify(documentEmbeddings));

    const astraDocs = splitStrings.map((splitString, index) => ({
      fileId: fileId,
      text: splitString,
      $vector: documentEmbeddings[index],
    }));

    console.log("Astra docs: ", JSON.stringify(astraDocs));

    const db = new AstraDB(ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_API_ENDPOINT);

    const collection = await db.collection("ragette_cosine");

    const res = await collection.insertMany(astraDocs);

    console.log("Inserted: ", res);

    return "DOCUMENT_STORED";
  } catch (error) {
    console.log("Error: ", error);
    throw error;
  }
}
