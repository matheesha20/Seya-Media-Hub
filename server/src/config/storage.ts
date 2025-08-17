import AWS from 'aws-sdk';

// Configure AWS SDK for Hetzner Object Storage
const s3Config = {
  endpoint: process.env.HETZNER_ENDPOINT || 'https://s3.eu-central-1.hetzner.com',
  accessKeyId: process.env.HETZNER_ACCESS_KEY_ID,
  secretAccessKey: process.env.HETZNER_SECRET_ACCESS_KEY,
  region: process.env.HETZNER_REGION || 'eu-central-1',
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
};

export const s3 = new AWS.S3(s3Config);

export const BUCKET_NAME = process.env.HETZNER_BUCKET_NAME || 'seya-media-hub';

// Storage utility functions
export const uploadToStorage = async (
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    ACL: 'public-read'
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload file to storage');
  }
};

export const deleteFromStorage = async (key: string): Promise<void> => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error('Failed to delete file from storage');
  }
};

export const getSignedUrl = async (
  key: string,
  operation: 'getObject' | 'putObject' = 'getObject',
  expiresIn: number = 3600
): Promise<string> => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: expiresIn
  };

  try {
    if (operation === 'getObject') {
      return s3.getSignedUrl('getObject', params);
    } else {
      return s3.getSignedUrl('putObject', params);
    }
  } catch (error) {
    console.error('Signed URL error:', error);
    throw new Error('Failed to generate signed URL');
  }
};
