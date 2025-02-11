import { NextApiRequest, NextApiResponse } from 'next';
import { getDocument } from '../../firebase/firestore/getData';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
  
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid parameters' });
    }
  
    const { result, error } = await getDocument("comments", id);
  
    if (error) {
      return res.status(500).json({ message: 'Error fetching document', error });
    }
  
    if (result && result.exists()) {
      return res.status(200).json({id : result.id, data: result.data()});
    } else {
      return res.status(404).json({ message: 'Document not found' });
    }
}