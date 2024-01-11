"use client";

import { useChat } from "ai/react";

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <main className="flex min-h-screen flex-col lg:w-1/3 sm:w-full mx-auto py-24">
      <div className="scroll-auto flex-grow flex-col bg-gray-600 rounded-2xl">
        {messages.map((message) => {
          return (
            <div
              key={message.id}
              className={`flex p-2 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg p-2 ${
                  message.role === "user" ? "bg-gray-500" : "bg-blue-500"
                }`}
              >
                {message.content}
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-4">
        <form onSubmit={handleSubmit} className="flex w-full">
          <input
            className="border-2 border-gray-300 rounded-lg w-full p-2 focus:outline-none focus:border-blue-500 text-black"
            placeholder="Chat here..."
            onChange={handleInputChange}
            value={input}
          />
          <button className="bg-blue-500 text-white rounded-lg p-2 ml-2 hover:bg-blue-400 transition-colors ease-in-out">
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
