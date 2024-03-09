"use client";

import { useSearchParams } from "next/navigation";
import { useChat } from "ai/react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import SpinnerIcon from "../components/icons/spinner";
import UserIcon from "../components/icons/user";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const fileId = searchParams.get("fileId");

  const { messages, isLoading, input, handleInputChange, handleSubmit } =
    useChat();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [fileStatus, setFileStatus] = useState("");
  const [FuleStatusError, setFileStatusError] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    console.log(messages);
  }, [messages]);

  async function handleNewMessage(e: React.FormEvent<HTMLFormElement>) {
    setFileStatus("");
    setFileStatusError("");

    handleSubmit(e, { options: { body: { fileId } } });

    /*

    Set up an SSE route to get file processing status, commenting out for the time being since the response is so fast.
    Saving for future reference or use.

    */

    // const eventSource = new EventSource(`/api/status?fileId=${fileId}`, {
    //   withCredentials: true,
    // });

    // eventSource.onopen = () => {
    //   console.log("Connection to status route opened.");
    // };

    // eventSource.onmessage = (event) => {
    //   console.log("Received:", event.data);
    //   setFileStatus(event.data);
    //   if (event.data === "Done") {
    //     eventSource.close();
    //   }
    // };

    // eventSource.onerror = (error) => {
    //   console.error(error.currentTarget, error.type);
    //   console.error("EventSource failed:", error);
    //   setFileStatusError("Error reading file status");
    //   eventSource.close();
    // };
  }

  return (
    <main className="md:1/2 mx-auto flex h-screen w-full flex-col pb-2 lg:w-1/3">
      <div className="absolute z-10 h-12 w-full bg-gradient-to-b from-stone-900 to-transparent md:h-24 md:w-1/3" />
      <div className="flex flex-grow flex-col overflow-auto rounded-lg px-2 text-sm md:text-base">
        {messages.length === 0 && (
          <div className="m-auto w-2/3 animate-fade-in-half text-center text-lg text-stone-300 opacity-50">
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
                {message.role === "assistant" && (
                  <div className="mr-2 mt-1 flex h-8 w-8 min-w-8 items-center justify-center rounded-full border border-stone-600 bg-stone-800 text-2xl font-extralight text-amber-400">
                    R
                  </div>
                )}
                <div
                  className={`rounded-lg px-2.5 py-2 ${
                    message.role === "user"
                      ? "bg-neutral-800 text-neutral-300 shadow-md"
                      : "border border-stone-700 bg-stone-800 text-stone-300 shadow-md"
                  }`}
                >
                  <Markdown>{message.content}</Markdown>
                </div>
                {message.role === "user" && (
                  <div className="ml-2 mt-1 flex h-8 w-8 min-w-8 items-center justify-center rounded-full border border-stone-600 bg-stone-800 text-amber-400">
                    <UserIcon />
                  </div>
                )}
              </div>
            </>
          );
        })}
        {isLoading && messages[messages.length - 1].role === "user" && (
          <div className="flex p-2">
            <div className="mr-2 mt-1 flex h-8 w-8 min-w-8 items-center justify-center rounded-full border border-stone-600 bg-stone-800 text-2xl font-extralight text-amber-400">
              R
            </div>
            <div className="rounded-lg border border-stone-700 bg-stone-800 px-2.5 py-2 text-stone-300 shadow-md">
              <div className="flex items-center">
                <SpinnerIcon />
                <div className="ml-2 animate-pulse">Reading your file</div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={(e) => handleNewMessage(e)}
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
