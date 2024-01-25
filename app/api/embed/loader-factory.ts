import { WebPDFLoader } from "langchain/document_loaders/web/pdf";

export default async function loaderFactory(file: Blob) {
  const fileType = file.type;
  switch (fileType) {
    case "application/pdf":
      return new WebPDFLoader(file);
    default:
      throw new Error("Unsupported file type");
  }
}
