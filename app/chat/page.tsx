"use client";

import { useSearchParams } from "next/navigation";
import { useChat } from "ai/react";
import { useRef, RefObject } from "react";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const fileId = searchParams.get("fileId");

  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const inputFileRef: RefObject<HTMLInputElement> = useRef(null);

  return (
    <main className="mx-auto flex min-h-screen flex-col py-24 sm:w-full lg:w-1/3">
      <div className="h-5/6 flex-grow flex-col scroll-auto rounded-lg">
        {messages.map((message) => {
          return (
            <div
              key={message.id}
              className={`flex p-2 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg px-2.5 py-2 ${
                  message.role === "user"
                    ? "bg-neutral-800 text-neutral-100 shadow-md"
                    : "border border-stone-700 bg-stone-800 text-stone-100 shadow-md"
                }`}
              >
                {message.content}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4">
        <form
          onSubmit={(e) => handleSubmit(e, { options: { body: { fileId } } })}
          className="flex w-full rounded-lg bg-stone-800 text-stone-200 ring-transparent focus-within:ring-1 focus-within:ring-stone-700"
        >
          <input name="file" ref={inputFileRef} type="file" hidden />
          <button
            type="button"
            className="rounded-md bg-transparent p-2 transition-colors ease-in-out hover:text-white"
            onClick={(e) => {
              e.preventDefault();
              inputFileRef.current?.click();
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15"
              />
            </svg>
          </button>
          <input
            className="w-full bg-transparent p-2 focus:outline-none"
            placeholder="Message your RAG bot..."
            onChange={handleInputChange}
            value={input}
          />
          <button
            type="submit"
            className="rounded-md bg-transparent p-2 transition-colors ease-in-out hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </form>
      </div>
    </main>
  );
}
