import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { StorageAdapter } from "./storage";

export interface S3Config {
  bucketName?: string;
  publicUrl?: string;
  region?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export class S3StorageAdapter implements StorageAdapter {
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private publicUrl: string;
  private region: string;

  constructor(config?: S3Config) {
    this.bucketName = config?.bucketName || process.env.S3_BUCKET_NAME || '';
    this.publicUrl = config?.publicUrl || process.env.S3_PUBLIC_URL || '';
    this.region = config?.region || process.env.S3_REGION || 'auto';
    
    const accessKeyId = config?.accessKeyId || process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = config?.secretAccessKey || process.env.S3_SECRET_ACCESS_KEY;
    const endpoint = config?.endpoint || process.env.S3_ENDPOINT;

    if (accessKeyId && secretAccessKey && this.bucketName) {
      this.s3Client = new S3Client({
        region: this.region,
        endpoint: endpoint || undefined,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  async upload(fileBuffer: Buffer, filename: string, mimeType: string): Promise<string> {
    if (!this.s3Client) {
      throw new Error('S3 Storage credentials are missing. Please configure them in Media Settings.');
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: filename,
      Body: fileBuffer,
      ContentType: mimeType,
      // ACL: 'public-read', // R2 typically manages public access at the bucket level
    });

    await this.s3Client.send(command);

    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/$/, '')}/${filename}`;
    }

    // Default AWS S3 URL format
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${filename}`;
  }

  async delete(filename: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error('S3 Storage credentials are missing. Please configure them in Media Settings.');
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: filename,
    });

    await this.s3Client.send(command);
  }
}
