export const generateImage = async (prompt: string): Promise<string> => {
  // curl  --request POST   --header "Authorization: Bearer ..."  --data "@prompt.json" "https://llm.api.cloud.yandex.net/foundationModels/v1/imageGenerationAsync"
  const response = await fetch(
    "https://llm.api.cloud.yandex.net/foundationModels/v1/imageGenerationAsync",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.YA_JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        modelUri: `art://${process.env.YA_DIRECTORY_ID}/yandex-art/latest`,
        generationOptions: {
          seed: "1863",
          aspectRatio: {
            widthRatio: "2",
            heightRatio: "1",
          },
        },
        messages: [
          {
            text: prompt,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Yandex ML API error: ${response.statusText}`);
  }

  const data = await response.json();
  const operationId = data.id;

  await new Promise((resolve) => setTimeout(resolve, 2000)); // wait for 2 seconds before polling

  // Polling for the result
  //curl --request GET --header "Authorization: Bearer ..." https://llm.api.cloud.yandex.net:443/operations/fbvfoae10blk4gqd3etj | jq -r '.response | .image' | base64 -d > image.jpeg
  let result;
  for (let i = 0; i < 10; i++) {
    // Poll up to 10 times
    const pollResponse = await fetch(
      `https://llm.api.cloud.yandex.net/operations/${operationId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.YA_JWT}`,
        },
      }
    );

    if (!pollResponse.ok) {
      throw new Error(
        `Yandex ML API polling error: ${pollResponse.statusText}`
      );
    }

    result = await pollResponse.json();
    if (result.done) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000)); // wait for 2 seconds before next poll
  }

  if (!result.done) {
    throw new Error("Yandex ML API operation did not complete in time");
  }

  return result.response.image;
};
