// pages/api/check-processing-status.ts
import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient({
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
        TableName: process.env.STATUS_TABLE_NAME!,
        Key: { folderName },
      };

      const result = await dynamodb.get(params).promise();
      
      if (result.Item) {
        res.status(200).json(result.Item);
      } else {
        res.status(404).json({ error: 'Status not found' });
      }
    } catch (error) {
      console.error('Error checking processing status:', error);
      res.status(500).json({ error: 'Error checking processing status' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}