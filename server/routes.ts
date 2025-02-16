import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { insertFileSchema } from "@shared/schema";

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error("AWS credentials are not configured");
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
console.log('BUCKET_NAME:', BUCKET_NAME);

if (!BUCKET_NAME) {
  throw new Error("AWS_BUCKET_NAME is not configured");
}

export async function registerRoutes(app: Express) {
  app.get("/api/files", async (_req, res) => {
    try {
      const files = await storage.getFiles();
      res.json(files);
    } catch (error) {
      console.error("Error getting files:", error);
      res.status(500).json({ error: "Failed to get files" });
    }
  });

  app.post("/api/files/upload-url", async (req, res) => {
    try {
      const result = insertFileSchema.safeParse(req.body);
      if (!result.success) {
        console.error("Validation error:", result.error);
        return res.status(400).json({ error: "Invalid file data" });
      }

      const { filename, key, size } = result.data;
      const contentType = req.body.contentType || 'application/octet-stream';

      console.log('Generating pre-signed URL for:', {
        filename,
        key,
        size,
        contentType
      });

      // Create a pre-signed URL with proper headers
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { 
        expiresIn: 3600,
      });

      console.log('Generated pre-signed URL with content type:', contentType);

      const file = await storage.createFile({ filename, key, size });

      res.json({
        url: signedUrl,
        file,
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.get("/api/files/:id/download", async (req, res) => {
    const id = parseInt(req.params.id);

    try {
      const file = await storage.getFile(id);

      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      console.log('Bucket name:', BUCKET_NAME);

      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: file.key,
        ResponseContentDisposition: "attachment"
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      res.json({ url: signedUrl });
    } catch (error) {
      console.error("Error generating download URL:", error);
      res.status(500).json({ error: "Failed to generate download URL" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}