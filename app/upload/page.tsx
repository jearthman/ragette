"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import SpinnerIcon from "../components/icons/spinner";
import CheckIcon from "../components/icons/check";

export default function AvatarUploadPage() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [uploadStep, setUploadStep] = useState(0);

  return (
    <main className="flex h-screen w-screen flex-col items-center">
      <h1 className="mt-40 text-4xl font-bold tracking-wide text-stone-300 sm:mt-40 lg:mt-96">
        Upload Your <span className="underline decoration-amber-400">File</span>
      </h1>
      <h3 className="text-md text-stone-400">
        Supports .pdf, .csv, .txt, .word
      </h3>

      <form className="flex gap-2">
        <input
          name="file"
          ref={inputFileRef}
          type="file"
          hidden
          onChange={async (e) => {
            if (!e.target.files) {
              return;
            }

            const file = e.target.files[0];

            if (!file) {
              return;
            }

            setFileName(file.name.split(".")[0]);
            setFileType(file.type.split("/")[1].toUpperCase());

            setUploadStep(1);

            const response = await upload(file.name, file, {
              access: "public",
              handleUploadUrl: "/api/upload",
              clientPayload: uuidv4(),
            });

            if (response.url) {
              setUploadStep(2);

              //send url to rag backend
            }
          }}
        />
        <button
          className="mt-4 flex rounded-md bg-stone-700 px-2.5 py-2 text-stone-300 shadow-sm transition hover:bg-stone-600 hover:shadow-md active:bg-stone-700 active:shadow-inner disabled:opacity-30 disabled:hover:bg-stone-700"
          onClick={(e) => {
            e.preventDefault();
            inputFileRef.current?.click();
          }}
          type="submit"
          disabled={!!fileName}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="mr-1 h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15"
            />
          </svg>
          Upload
        </button>
      </form>
      {!!uploadStep && (
        <div className="flex flex-col">
          <div className="mb-4 mt-12 flex items-center gap-2 self-center text-stone-300">
            <div className="font-semibold">{fileName}</div>
            <div className="rounded-full border border-amber-400 bg-amber-300 px-1 py-0.5 text-xs font-bold text-amber-700">
              {fileType}
            </div>
          </div>

          <div className="flex w-64 items-center lg:w-1/6">
            <div
              className={`mr-2 flex h-7 w-7 items-center justify-center rounded-full bg-stone-700`}
            >
              {uploadStep === 1 && <SpinnerIcon />}
              {uploadStep === 2 && <CheckIcon />}
            </div>
            <div className="text-stone-400">Uploading to Blob Storage</div>
          </div>

          {uploadStep === 2 && (
            <>
              <div className="my-1 ml-3 h-3 w-1 rounded-full bg-stone-700 opacity-70"></div>
              <div className="flex w-64 items-center lg:w-1/6">
                <div className="mr-2 flex h-7 w-7 items-center justify-center rounded-full bg-stone-700">
                  <SpinnerIcon />
                </div>
                <div className="text-stone-400">Splitting up Doc</div>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
