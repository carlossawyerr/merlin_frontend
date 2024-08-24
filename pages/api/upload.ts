import { NextApiRequest, NextApiResponse } from 'next';
import aws from 'aws-sdk';

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Function to determine the appropriate bucket
function getBucketName(contentType: string): string {
  if (contentType.startsWith('video/')) {
    return process.env.VIDEO_BUCKET_NAME || 'merlin-user-video-bucket';
  } else if (contentType.startsWith('text/')) {
    return process.env.SCRIPT_BUCKET_NAME || 'merlin-user-script-upload-bucket';
  } else {
    throw new Error('Unsupported file type');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { name, type, folderName } = req.body;

      if (!folderName) {
        return res.status(400).json({ error: 'Folder name is required' });
      }

      const bucketName = getBucketName(type);

      const params = {
        Bucket: bucketName,
        Key: `${folderName}/${name}`, // Upload to a specific folder
        Expires: 60,
        ContentType: type,
      };

      const url = await s3.getSignedUrlPromise('putObject', params);

      // Log the upload details
      console.log(`File "${name}" (${type}) routed to bucket: ${bucketName}, folder: ${folderName}`);

      res.status(200).json({ url });
    } catch (error) {
      console.error('Error creating signed URL:', error);
      res.status(500).json({ error: 'Error creating signed URL' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}