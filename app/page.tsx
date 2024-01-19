"use client";

import { useChat } from "ai/react";
import { useRef, RefObject } from "react";

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const inputFileRef: RefObject<HTMLInputElement> = useRef(null);

  return (
    <main className="flex min-h-screen flex-col lg:w-1/3 sm:w-full mx-auto py-24">
      <div className="scroll-auto flex-grow flex-col rounded-lg h-5/6">
        {messages.map((message) => {
          return (
            <div
              key={message.id}
              className={`flex p-2 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg py-2 px-2.5 ${
                  message.role === "user"
                    ? "bg-neutral-800 text-neutral-100 shadow-md"
                    : "bg-stone-800 text-stone-100 border border-stone-700 shadow-md"
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
          onSubmit={handleSubmit}
          className="flex w-full bg-stone-800 rounded-lg ring-transparent focus-within:ring-1 focus-within:ring-stone-700 text-stone-200"
        >
          <input name="file" ref={inputFileRef} type="file" hidden />
          <button
            type="button"
            className="bg-transparent rounded-md p-2 hover:text-white transition-colors ease-in-out"
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
              className="w-6 h-6"
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
            className="bg-transparent rounded-md p-2 hover:text-white transition-colors ease-in-out"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              className="w-6 h-6"
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
