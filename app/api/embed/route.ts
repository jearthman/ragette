import vectorizeFile from "./vectorization";
import { del } from "@vercel/blob";

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();

  const { fileUrl, fileId } = body;

  const fileResponse = await fetch(fileUrl);

  const file = await fileResponse.blob();

  del(fileUrl);
  try {
    const vectorizationIter = vectorizeFile(file, fileId);
    const vectorizationStream = iteratorToStream(vectorizationIter);

    return new Response(vectorizationStream, {
      headers: {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    console.log(error);
    return new Response("Error uploading file to vectorDB", { status: 403 });
  }
}

function iteratorToStream(iterator: any) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();

      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
}
