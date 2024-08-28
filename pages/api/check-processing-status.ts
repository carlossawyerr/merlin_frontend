import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { folderId } = req.query;

    if (!folderId) {
      console.error('Folder ID is missing in the request');
      return res.status(400).json({ error: 'Folder ID is required' });
    }

    console.log('Checking status for folderId:', folderId);

    try {
      const params = {
        TableName: process.env.STATUS_TABLE_NAME!,
        Key: { folderName: folderId },  // Ensure this matches your table's primary key
      };

      console.log('DynamoDB Query Params:', params);

      const result = await dynamodb.get(params).promise();

      console.log('DynamoDB Query Result:', result);

      if (result.Item) {
        res.status(200).json(result.Item);
      } else {
        console.error('No status found for the given folderId:', folderId);
        res.status(404).json({ error: 'Status not found' });
      }
    } catch (error) {
      console.error('Error checking processing status:', error);
      res.status(500).json({ error: 'Error checking processing status' });
    }
  } else {
    console.error('Invalid request method:', req.method);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
