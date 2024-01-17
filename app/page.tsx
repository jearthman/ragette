"use client";

import { useChat } from "ai/react";

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <main className="flex min-h-screen flex-col lg:w-1/3 sm:w-full mx-auto py-24">
      <div className="scroll-auto flex-grow flex-col bg-gray-800 rounded-lg h-5/6">
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
                  message.role === "user" ? "bg-gray-700" : "bg-blue-900"
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
          className="flex w-full bg-gray-800 rounded-lg ring-transparent focus-within:ring-1 focus-within:ring-blue-900"
        >
          <button className="bg-transparent text-gray-300 rounded-md p-2 hover:text-white transition-colors ease-in-out">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="28"
              viewBox="0 -960 960 960"
              width="28"
              className="fill-current"
            >
              <path d="M440-367v127q0 17 11.5 28.5T480-200q17 0 28.5-11.5T520-240v-127l36 36q6 6 13.5 9t15 2.5q7.5-.5 14.5-3.5t13-9q11-12 11.5-28T612-388L508-492q-6-6-13-8.5t-15-2.5q-8 0-15 2.5t-13 8.5L348-388q-12 12-11.5 28t12.5 28q12 11 28 11.5t28-11.5l35-35ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h287q16 0 30.5 6t25.5 17l194 194q11 11 17 25.5t6 30.5v447q0 33-23.5 56.5T720-80H240Zm280-560v-160H240v640h480v-440H560q-17 0-28.5-11.5T520-640ZM240-800v200-200 640-640Z" />
            </svg>
          </button>
          <input
            className="w-full bg-transparent text-white p-2 focus:outline-none"
            placeholder="Chat here..."
            onChange={handleInputChange}
            value={input}
          />
          <button className="bg-transparent text-gray-300 rounded-md p-2 hover:text-white transition-colors ease-in-out">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="28"
              viewBox="0 -960 960 960"
              width="28"
              className="fill-current"
            >
              <path d="M792-443 176-183q-20 8-38-3.5T120-220v-520q0-22 18-33.5t38-3.5l616 260q25 11 25 37t-25 37ZM200-280l474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
            </svg>
          </button>
        </form>
      </div>
    </main>
  );
}
