"use client";

import { useSearchParams } from "next/navigation";
import { useChat } from "ai/react";
import { useEffect, useRef } from "react";
import Markdown from "react-markdown";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const fileId = searchParams.get("fileId");

  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <main className="md:1/2 mx-auto flex h-screen w-full flex-col pb-2 lg:w-1/3">
      <div className="absolute z-10 h-12 w-full bg-gradient-to-b from-stone-900 to-transparent md:h-24 md:w-1/3" />
      <div className="flex flex-grow flex-col overflow-auto rounded-lg px-2 text-sm md:text-base">
        {messages.length === 0 && (
          <div className="animate-fade-in-half m-auto w-2/3 text-center text-lg text-stone-300 opacity-50">
            Please ask <span className="text-amber-400">RAGette</span> anything
            about your file.
          </div>
        )}
        {messages.map((message) => {
          return (
            <>
              <div
                key={message.id}
                className={`flex p-2 first:mt-12 first:md:mt-24 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-lg px-2.5 py-2 ${
                    message.role === "user"
                      ? "bg-neutral-800 text-neutral-300 shadow-md"
                      : "border border-stone-700 bg-stone-800 text-stone-300 shadow-md"
                  }`}
                >
                  <div
                    className={`mb-0.5 text-[10px] text-amber-400 ${
                      message.role === "user" ? "text-right" : "text-left"
                    } `}
                  >
                    {message.role === "user" ? "You" : "Ragette"}
                  </div>
                  <Markdown>{message.content}</Markdown>
                </div>
              </div>
            </>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={(e) => handleSubmit(e, { options: { body: { fileId } } })}
        className="mx-2 flex rounded-lg bg-stone-800 text-stone-300 ring-transparent focus-within:ring-1 focus-within:ring-stone-700"
      >
        <input
          ref={inputRef}
          className="w-full bg-transparent px-5 py-3 focus:outline-none"
          placeholder="Message your RAG bot..."
          onChange={handleInputChange}
          value={input}
        />
        <button
          type="submit"
          className="rounded-md bg-transparent p-2 pr-3 transition-colors ease-in-out hover:text-white"
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
    </main>
  );
}
