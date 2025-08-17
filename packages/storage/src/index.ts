import { S3, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export interface StorageProvider {
  putObject(key: string, body: Buffer, contentType: string): Promise<void>;
  getSignedPutUrl(key: string, expiresIn: number): Promise<string>;
  getSignedGetUrl(key: string, expiresIn: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
}

export class HetznerS3Provider implements StorageProvider {
  private client: S3;
  private bucket: string;

  constructor(opts: { endpoint: string; region: string; accessKeyId: string; secretAccessKey: string; bucket: string }) {
    this.client = new S3({
      region: opts.region,
      endpoint: opts.endpoint,
      credentials: {
        accessKeyId: opts.accessKeyId,
        secretAccessKey: opts.secretAccessKey
      },
      forcePathStyle: true
    });
    this.bucket = opts.bucket;
  }

  async putObject(key: string, body: Buffer, contentType: string) {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType
    }));
  }

  async deleteObject(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async getSignedPutUrl(key: string, expiresIn: number): Promise<string> {
    // Hetzner S3 does not provide direct signing in SDK; placeholder for presign logic
    throw new Error('getSignedPutUrl not implemented');
  }

  async getSignedGetUrl(key: string, expiresIn: number): Promise<string> {
    throw new Error('getSignedGetUrl not implemented');
  }
}
