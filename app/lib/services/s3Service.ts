import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import zlib from "zlib";

const getS3 = () => {
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT_URL || "https://storage.yandexcloud.net",
    region: "ru-central1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
  });
};

export const uploadFileToS3 = async (
  key: string,
  content: Buffer | string,
  type?: string,
  contentEncoding?: string,
): Promise<string> => {
  const bucket = process.env.S3_BUCKET || "";
  if (!bucket) {
    throw new Error("S3_BUCKET environment variable is not set");
  }

  const params: PutObjectCommandInput = {
    Bucket: bucket,
    Key: key,
    Body: content,
    ContentType: type,
    ContentEncoding: contentEncoding,
    ACL: "public-read",
  };

  try {
    await getS3().send(new PutObjectCommand(params));
    return key;
  } catch (error) {
    console.error("Error uploading file to S3:", bucket, error);
    throw error;
  }
};

