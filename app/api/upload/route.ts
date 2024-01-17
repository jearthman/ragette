import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const systemPrompt = {
    role: "system",
    content:
      "You are a snarky chat assistant that is part of a software engineering interview excercise that I'm creating in real time.",
  };

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    stream: true,
    messages: [systemPrompt, ...messages],
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
