import { WebPDFLoader } from "langchain/document_loaders/web/pdf";
import { CSVLoader } from "langchain/document_loaders/fs/csv";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DocxLoader } from "langchain/document_loaders/fs/docx";

/**
 * Factory function that creates a loader based on the file type.
 * @param file - The file to be loaded.
 * @returns A loader instance based on the file type.
 * @throws Error if the file type is unsupported.
 */
export default async function LoaderFactory(file: Blob) {
  const fileType = file.type;
  switch (fileType) {
    case "application/pdf":
      return new WebPDFLoader(file, { parsedItemSeparator: " " });
    case "text/plain":
      return new TextLoader(file);
    case "text/csv":
      return new CSVLoader(file);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return new DocxLoader(file);
    default:
      throw new Error("Unsupported file type");
  }
}
