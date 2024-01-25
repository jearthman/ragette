"use client";

import { signIn } from "next-auth/react";
import { Roboto_Flex } from "next/font/google";
import Image from "next/image";

const roboto = Roboto_Flex({
  subsets: ["latin"],
  weight: ["500"],
});

export default function GithubSignInButton() {
  async function handleSignIn() {
    await signIn("github", { callbackUrl: `${window.location.origin}/upload` });
  }
  return (
    <button
      onClick={handleSignIn}
      className={`${roboto.className} relative flex w-[178px] items-center justify-center rounded border border-gray-300 bg-white px-3 py-[10px] shadow focus:outline-none focus:ring focus:ring-blue-200 focus:ring-opacity-50 enabled:hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none`}
    >
      <Image
        src="/github-mark.png"
        alt="Github Logo"
        width={20}
        height={20}
      ></Image>
      <span className="ml-[10px] text-sm">Sign in with Github</span>
    </button>
  );
}
