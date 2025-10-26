import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "@/constants/s3";

// Initialize S3 client
const AWS_REGION = import.meta.env.VITE_AWS_REGION || "us-east-1";
const AWS_ACCESS_KEY_ID = import.meta.env.VITE_AWS_ACCESS_KEY_ID || "";
const AWS_SECRET_ACCESS_KEY = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || "";

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = import.meta.env.VITE_AWS_S3_BUCKET_NAME || "";
const IMAGES_FOLDER =
  import.meta.env.VITE_AWS_S3_IMAGES_FOLDER || "company-images";
const FILES_FOLDER = import.meta.env.VITE_AWS_S3_FILES_FOLDER || "files";

const bucketUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`;

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Generate a unique filename for the logo
 */
function generateImageFilename(
  companyId: string,
  originalName: string,
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const extension = originalName.split(".").pop()?.toLowerCase() || "jpg";
  return `image-${timestamp}.${extension}`;
}

/**
 * Get the S3 key for a company logo
 */
function getImageKey(companyId: string, filename: string): string {
  return `${IMAGES_FOLDER}/${companyId}/${filename}`;
}

function getFileKey(filename: string): string {
  return `${FILES_FOLDER}/${filename}`;
}

/**
 * Upload a file to S3
 */
export async function uploadImageToS3(
  file: File,
  companyId: string,
): Promise<UploadResult> {
  try {
    if (!BUCKET_NAME) {
      throw new Error("S3 bucket name not configured");
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(
        "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
      );
    }

    // Validate file size (max 5MB)
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error("File size too large. Maximum size is 5MB.");
    }

    const filename = generateImageFilename(companyId, file.name);
    const key = getImageKey(companyId, filename);

    // Convert file to buffer
    const buffer = await file.arrayBuffer();

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Return the public URL
    const publicUrl = `${bucketUrl}/${key}`;

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Delete a logo from S3
 */
export async function deleteLogoFromS3(logoUrl: string): Promise<DeleteResult> {
  try {
    if (!BUCKET_NAME) {
      throw new Error("S3 bucket name not configured");
    }

    // Extract the key from the URL

    const key = logoUrl.replace(`${bucketUrl}/`, "");

    if (!key.startsWith(IMAGES_FOLDER)) {
      throw new Error("Invalid logo URL");
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting from S3:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * Generate a presigned URL for direct upload (alternative approach)
 */
export async function generatePresignedUploadUrl(
  companyId: string,
  filename: string,
  contentType: string,
): Promise<{ url: string; key: string } | null> {
  try {
    if (!BUCKET_NAME) {
      throw new Error("S3 bucket name not configured");
    }

    const key = getImageKey(companyId, filename);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

    return { url, key };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return null;
  }
}

export async function uploadFileToS3(file: File): Promise<UploadResult> {
  try {
    if (!BUCKET_NAME) {
      throw new Error("S3 bucket name not configured");
    }

    const buffer = await file.arrayBuffer();
    const key = getFileKey(file.name);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
    });

    await s3Client.send(command);

    const publicUrl = `${bucketUrl}/${key}`;

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export async function deleteFileFromS3(fileUrl: string): Promise<DeleteResult> {
  try {
    if (!BUCKET_NAME) {
      throw new Error("S3 bucket name not configured");
    }

    const key = fileUrl.replace(`${bucketUrl}/`, "");

    if (!key.startsWith(FILES_FOLDER)) {
      throw new Error("Invalid file URL");
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting from S3:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

export interface InterviewTranscript {
  sessionId: string;
  candidateEmail?: string;
  jobTitle?: string;
  questions?: Array<{ id: string; order: number; question: string }>;
  messages?: Array<{ source: string; message: string; at: string }>;
  endedAt: string;
}

export interface GetTranscriptResult {
  success: boolean;
  transcript?: InterviewTranscript;
  error?: string;
}

/**
 * Get interview transcript from S3 by URL
 */
export async function getInterviewTranscriptFromS3(
  transcriptUrl: string,
): Promise<GetTranscriptResult> {
  try {
    if (!BUCKET_NAME) {
      throw new Error("S3 bucket name not configured");
    }

    // Extract the key from the URL
    // URL format: https://bucket-name.s3.region.amazonaws.com/files/interviews/sessionId-timestamp.json
    const key = transcriptUrl.replace(`${bucketUrl}/`, "");

    if (!key) {
      throw new Error("Invalid transcript URL");
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);

    // Read the response body as text
    const transcriptText = await response.Body?.transformToString();

    if (!transcriptText) {
      throw new Error("Empty transcript file");
    }

    const transcript: InterviewTranscript = JSON.parse(transcriptText);

    return {
      success: true,
      transcript,
    };
  } catch (error) {
    console.error("Error fetching transcript from S3:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch transcript",
    };
  }
}
