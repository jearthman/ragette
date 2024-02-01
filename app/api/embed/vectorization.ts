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

    console.log("Docs loaded: ", docs.length);

    const splitter = new RecursiveCharacterTextSplitter();

    const splitDocs = await splitter.splitDocuments(docs);

    console.log("Docs split: ", splitDocs.length);

    const splitStrings = splitDocs.map((doc) => doc.pageContent);

    const embeddings = new OpenAIEmbeddings();

    const documentEmbeddings = await embeddings.embedDocuments(splitStrings);

    const astraDocs = splitStrings.map((splitString, index) => ({
      fileId: fileId,
      text: splitString,
      $vector: documentEmbeddings[index],
    }));

    const db = new AstraDB(ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_API_ENDPOINT);

    const collection = await db.collection("ragette_cosine");

    const res = await collection.insertMany(astraDocs);

    console.log("Inserted: ", res);

    return "DOCUMENT_STORED";
  } catch (error) {
    throw error;
  }
}
