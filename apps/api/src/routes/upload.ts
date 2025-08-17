import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { HetznerS3Provider } from '@seya/storage';

export default async function uploadRoutes(app: FastifyInstance) {
  app.post('/upload/token', async (req, reply) => {
    const body = z.object({ key: z.string() }).parse(req.body);
    const provider = new HetznerS3Provider({
      endpoint: process.env.S3_ENDPOINT!,
      region: process.env.S3_REGION!,
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      bucket: process.env.S3_BUCKET!
    });
    // TODO: implement signing
    const uploadUrl = await provider.getSignedPutUrl(body.key, 60 * 5).catch(() => '');
    return { uploadUrl };
  });
}
