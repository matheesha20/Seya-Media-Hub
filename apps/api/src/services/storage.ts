import AWS from 'aws-sdk'
import { config } from '../config'

// Configure AWS SDK for S3-compatible storage
const s3 = new AWS.S3({
  endpoint: config.s3Endpoint,
  region: config.s3Region,
  accessKeyId: config.s3AccessKey,
  secretAccessKey: config.s3SecretKey,
  s3ForcePathStyle: true, // Required for S3-compatible services
})

export class StorageService {
  private bucket: string

  constructor() {
    this.bucket = config.s3Bucket
  }

  async generatePresignedUrl(key: string, contentType: string, expiresIn: number = 3600): Promise<string> {
    const params = {
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      Expires: expiresIn,
    }

    return s3.getSignedUrl('putObject', params)
  }

  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<void> {
    const params = {
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }

    await s3.upload(params).promise()
  }

  async getFileStream(key: string): Promise<AWS.S3.GetObjectOutput> {
    const params = {
      Bucket: this.bucket,
      Key: key,
    }

    return s3.getObject(params).promise()
  }

  async deleteFile(key: string): Promise<void> {
    const params = {
      Bucket: this.bucket,
      Key: key,
    }

    await s3.deleteObject(params).promise()
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
      }

      await s3.headObject(params).promise()
      return true
    } catch (error) {
      if ((error as any).code === 'NotFound') {
        return false
      }
      throw error
    }
  }

  generateStorageKey(accountId: string, filename: string, kind: string): string {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const extension = filename.split('.').pop() || ''
    
    return `${kind}/${accountId}/${timestamp}_${randomId}.${extension}`
  }

  getPublicUrl(key: string): string {
    return `${config.s3Endpoint}/${this.bucket}/${key}`
  }
}

export const storageService = new StorageService()
