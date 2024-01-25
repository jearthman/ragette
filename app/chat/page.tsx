"use client";

import { useSearchParams } from "next/navigation";
import { useChat } from "ai/react";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const fileId = searchParams.get("fileId");

  const { messages, input, handleInputChange, handleSubmit } = useChat();

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
                    ? "bg-neutral-800 text-neutral-200 shadow-md"
                    : "border border-stone-700 bg-stone-800 text-stone-200 shadow-md"
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
          className="flex w-full rounded-lg bg-stone-800 text-stone-300 ring-transparent focus-within:ring-1 focus-within:ring-stone-700"
        >
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
              strokeWidth="1.5"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </form>
      </div>
    </main>
  );
}
