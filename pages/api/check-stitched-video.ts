// pages/api/check-stitched-video.ts
import { NextApiRequest, NextApiResponse } from 'next';
import aws from 'aws-sdk';

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { folderName } = req.query;

    if (!folderName) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    try {
      const params = {
        Bucket: process.env.STITCHED_VIDEO_BUCKET_NAME || 'merlin-stitched-video-bucket',
        Prefix: `${folderName}/`,
      };

      const data = await s3.listObjectsV2(params).promise();

      if (data.Contents && data.Contents.length > 0) {
        // Assuming the stitched video is the first (and only) file in the folder
        const stitchedVideoKey = data.Contents[0].Key;
        const url = s3.getSignedUrl('getObject', {
          Bucket: params.Bucket,
          Key: stitchedVideoKey,
          Expires: 3600, // URL expires in 1 hour
        });

        return res.status(200).json({ url, available: true });
      } else {
        return res.status(200).json({ available: false });
      }
    } catch (error) {
      console.error('Error checking for stitched video:', error);
      return res.status(500).json({ error: 'Error checking for stitched video' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}