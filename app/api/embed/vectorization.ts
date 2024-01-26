import LoaderFactory from "./loader-factory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { AstraDB } from "@datastax/astra-db-ts";
import { OpenAIEmbeddings } from "@langchain/openai";

const { ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_API_ENDPOINT } = process.env;

export default async function vectorizeFile(file: Blob, fileId: string) {
  try {
    const loader = await LoaderFactory(file);

    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter();

    const splitDocs = await splitter.splitDocuments(docs);

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

    collection.insertMany(astraDocs);

    return "DOCUMENT_STORED";
  } catch (error) {
    throw error;
  }
}
