import { serviceClients, Session, cloudApi } from "@yandex-cloud/nodejs-sdk";
import jose from "node-jose";

const accessKeyId = process.env.YA_ID || "";
const serviceAccountId = process.env.YA_SERVICE_ACCOUNT_ID || "";
const privateKey = process.env.YA_PRIVATE_KEY || "";

const {
  iam: {
    iam_token_service: { CreateIamTokenRequest },
  },
} = cloudApi;

const createJWT = () => {
  const now = Math.floor(new Date().getTime() / 1000);
  const payload = {
    iss: serviceAccountId,
    iat: now,
    exp: now + 3600,
    aud: "https://iam.api.cloud.yandex.net/iam/v1/tokens",
  };
  return jose.JWK.asKey(privateKey, "pem", {
    kid: accessKeyId,
    alg: "PS256",
  }).then(function (result) {
    return jose.JWS.createSign({ format: "compact" }, result)
      .update(JSON.stringify(payload))
      .final();
  });
};

async function createIamToken() {
  const session = new Session({
    serviceAccountJson: {
      accessKeyId,
      serviceAccountId,
      privateKey,
    },
  });
  const tokenClient = session.client(serviceClients.IamTokenServiceClient);
  const jwt: any = await createJWT();
  const tokenRequest = CreateIamTokenRequest.fromPartial({ jwt });
  const { iamToken } = await tokenClient.create(tokenRequest);

  console.log("Your iam token:");
  console.log(iamToken);

  return iamToken;
}

export const generateImage = async (
  prompt: string,
  saveToFile: boolean = false,
): Promise<string> => {
  // curl  --request POST   --header "Authorization: Bearer ..."  --data "@prompt.json" "https://llm.api.cloud.yandex.net/foundationModels/v1/imageGenerationAsync"
  const aim_jwt_token = await createIamToken();
  const response = await fetch(
    "https://llm.api.cloud.yandex.net/foundationModels/v1/imageGenerationAsync",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aim_jwt_token}`,
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
    },
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
          Authorization: `Bearer ${aim_jwt_token}`,
        },
      },
    );

    if (!pollResponse.ok) {
      throw new Error(
        `Yandex ML API polling error: ${pollResponse.statusText}`,
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

  const imageBase64 = result.response.image;

  // Save to file if requested
  if (saveToFile) {
    try {
      const fs = await import("fs");
      const path = await import("path");

      // Create a filename from the prompt (sanitized)
      const sanitizedPrompt = prompt
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .substring(0, 50);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `yandex_ml_image_${sanitizedPrompt}_${timestamp}.jpeg`;
      const filepath = path.join(process.cwd(), filename);

      // Create directory if it doesn't exist
      const dirPath = process.cwd(); //path.join(process.cwd(), 'generated_images');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Decode base64 and save to file
      const buffer = Buffer.from(imageBase64, "base64");
      fs.writeFileSync(filepath, buffer);

      console.log(`✅ Image saved to: ${filepath}`);
    } catch (fileError) {
      console.error("❌ Error saving image to file:", fileError);
      // Don't throw, just log the error and continue
    }
  }

  return imageBase64;
};
