import Image from "next/image";
import { useChat } from "ai/react";
import { useRef, RefObject } from "react";
import GoogleSignInButton from "./components/google-sign-in-button";
import GithubSignInButton from "./components/github-sign-in-button";

export default function Home() {
  return (
    <main className="flex h-screen w-screen flex-col items-center">
      <div className="relative">
        <Image
          priority
          src="/ragette.png"
          alt="picture of ragette"
          width={200}
          height={200}
          className=" ml-3 mt-24 lg:mt-96"
        ></Image>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent to-20%"></div>
      </div>
      <h1 className="mt-4 text-4xl font-bold tracking-wide text-stone-300 sm:mt-4 lg:mt-4">
        <span className="underline decoration-amber-400">RAG</span>ette
      </h1>
      <h3 className="text-md mb-8 text-stone-400">Simple RAG Chatbot</h3>
      <GithubSignInButton />
      <div className="mt-2"></div>
      <GoogleSignInButton />
      <div className="mx-auto mt-4 px-20 text-center text-sm text-stone-400">
        Please <span className="text-stone-300">Sign In</span> so I can moderate
        naughty and gratuitous uploads.
      </div>
    </main>
  );
}
