"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";
import SpinnerIcon from "../components/icons/spinner";
import CheckIcon from "../components/icons/check";
import { useRouter } from "next/navigation";
import ChatIcon from "../components/icons/chat";
import DragAndDrop from "../components/drag-and-drop";

export default function FileUploadPage() {
  const router = useRouter();
  const inputFileRef = useRef<HTMLInputElement>(null);
  const fileIdRef = useRef<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [fileSizeFlag, setFileSizeFlag] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);
  const [wrongFileType, setWrongFileType] = useState(false);

  const generateID = (): string => {
    //ID for astra collection name

    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_";

    let result = characters.charAt(Math.floor(Math.random() * 52));

    for (let i = 1; i < 16; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }

    return result;
  };

  async function processFile(file: File) {
    setWrongFileType(false);

    if (!file) {
      return;
    }

    if (file.size > 1000000) {
      setFileSizeFlag(true);
    }

    let tempFileName = file.name.split(".")[0];
    if (tempFileName.length > 20) {
      tempFileName = tempFileName.slice(0, 20) + "...";
    }
    setFileName(tempFileName);
    if (
      !file.type ||
      !(
        file.type === "application/pdf" ||
        file.type === "text/plain" ||
        file.type === "text/csv"
      )
    ) {
      setWrongFileType(true);
      return;
    }
    setFileType(file.name.split(".")[1].toUpperCase());

    setUploadStep(1);

    fileIdRef.current = generateID();

    const uploadResponse = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
      clientPayload: fileIdRef.current,
    });

    if (uploadResponse.url) {
      setUploadStep(2);

      //send url to rag backend
      const embedResponse = await fetch("/api/embed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileUrl: uploadResponse.url,
          fileId: fileIdRef.current,
        }),
      });

      if (embedResponse.ok) {
        setUploadStep(3);
      }
    }
  }

  return (
    <main className="flex h-screen w-screen flex-col items-center">
      <h1 className="mt-40 text-4xl font-bold tracking-wide text-stone-300 sm:mt-40 lg:mt-96">
        Upload Your <span className="underline decoration-amber-400">File</span>
      </h1>
      <h3 className="text-md text-stone-400">
        Supports small .pdf, .csv, .txt files
      </h3>

      {/* <form className="flex gap-2">
        <input
          name="file"
          ref={inputFileRef}
          type="file"
          hidden
          onChange={(e) => processFile(e)}
        />
        <button
          className="mt-4 flex rounded-md bg-stone-700 px-2.5 py-2 text-stone-300 shadow-sm transition hover:bg-stone-600 hover:shadow-md active:bg-stone-700 active:shadow-inner disabled:opacity-30 disabled:hover:bg-stone-700"
          onClick={(e) => {
            e.preventDefault();
            inputFileRef.current?.click();
          }}
          type="submit"
          disabled={!!fileName && !wrongFileType}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="mr-1 h-6 w-6 animate-bounce-up"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15"
            />
          </svg>
          Upload
        </button>
      </form> */}

      <DragAndDrop
        processFile={processFile}
        disabled={!!fileName && !wrongFileType}
      />
      {wrongFileType && (
        <div className="mt-6 w-2/3 text-center text-sm text-red-400">
          File Type not supported currently. Please upload a .pdf, .csv, or .txt
          file.
        </div>
      )}
      {!!uploadStep && (
        <>
          <div className="flex w-72 flex-col">
            <div className="mb-4 mt-12 flex animate-fade-in items-center gap-2 self-center text-stone-300">
              <div className="font-semibold">{fileName}</div>
              <div className="rounded-full border border-amber-400 bg-amber-300 px-1 py-0.5 text-xs font-bold text-amber-700">
                {fileType}
              </div>
            </div>

            <div className="flex animate-fade-in items-center pl-6">
              <div
                className={`mr-2 flex h-7 w-7 items-center justify-center rounded-full bg-stone-700`}
              >
                {uploadStep === 1 && <SpinnerIcon />}
                {uploadStep >= 2 && <CheckIcon />}
              </div>
              <div className="text-stone-400">Uploading to Blob Storage</div>
            </div>

            {uploadStep >= 2 && (
              <div className="animate-fade-in-from-below pl-6">
                <div className="my-1 ml-3 h-3 w-1 rounded-full bg-stone-700 opacity-70"></div>
                <div className="flex items-center">
                  <div className="mr-2 flex h-7 w-7 items-center justify-center rounded-full bg-stone-700">
                    {uploadStep === 2 && <SpinnerIcon />}
                    {uploadStep === 3 && <CheckIcon />}
                  </div>
                  <div className="text-stone-400">Embedding for Vector DB</div>
                </div>
                {fileSizeFlag && uploadStep < 3 && (
                  <div className="pt-2 text-xs text-amber-400 opacity-50">
                    This may take a few minutes for larger files.
                  </div>
                )}
              </div>
            )}
          </div>
          {uploadStep === 3 && (
            <button
              onClick={() => router.push(`/chat?fileId=${fileIdRef.current}`)}
              className="mt-4 flex animate-fade-in gap-2 rounded-md border border-lime-700 bg-lime-900 px-2.5 py-2 text-lime-100 shadow-sm transition hover:bg-lime-800 hover:shadow-md active:bg-lime-900 active:shadow-inner disabled:opacity-30 disabled:hover:bg-lime-800"
            >
              <ChatIcon />
              Start Chat
            </button>
          )}
        </>
      )}
    </main>
  );
}
