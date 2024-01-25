import vectorizeFile from "./vectorization";

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();

  const { fileUrl, fileId } = body;

  const fileResponse = await fetch(fileUrl);

  const file = await fileResponse.blob();
  try {
    const retrievaResult = vectorizeFile(file, fileId);

    return new Response(JSON.stringify(retrievaResult), { status: 200 });
  } catch (error) {
    console.log(error);
    return new Response("Error uploading file to vectorDB", { status: 403 });
  }
}
