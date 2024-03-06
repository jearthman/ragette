import { kv } from "@vercel/kv";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest): Promise<Response> {
  const searchParams = request.nextUrl.searchParams;
  const fileId = searchParams.get("fileId");

  console.log("GETTING FILE STATUS");

  if (!fileId) {
    return new Response("fileId is required", { status: 400 });
  }

  let responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  writer.write(encoder.encode("data: " + "\n\n")); // Initial message or heartbeat

  while (true) {
    const message: string | null = await kv.get(`file_status:${fileId}`);
    if (message) {
      // Ensure the message follows the SSE format
      const formattedMessage = `data: ${message}\n\n`;
      writer.write(encoder.encode(formattedMessage));

      if (message === "Done") {
        kv.set(`file_status:${fileId}`, "");
        writer.close();
        break;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
