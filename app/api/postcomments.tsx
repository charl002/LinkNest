import { NextApiRequest, NextApiResponse } from 'next';
import addData from "../../firebase/firestore/addData";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { username, comment } = req.body;

  if (!username || !comment) {
    return res.status(400).json({ message: 'Username and comment are required' });
  }

  const data = { username, comment };

  const { result: docId, error } = await addData('comments', data);

  if (error) {
    return res.status(500).json({ message: 'Error adding comment', error });
  }

  return res.status(200).json({ message: 'Comment added successfully', id: docId });
}
