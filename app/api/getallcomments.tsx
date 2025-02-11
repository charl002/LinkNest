import { NextApiRequest, NextApiResponse } from "next";
import { getAllDocuments } from "../../firebase/firestore/getData";

export default async function getAllCommentsHandler(req: NextApiRequest, res: NextApiResponse){
    try{
        const { results, error} = await getAllDocuments("comments");
        if (error || !results){
            return res.status(500).json({ message: 'Error fetching comemnts', error});
        }

        if(results.empty){
            return res.status(404).json({ message: 'No Comments found' });
        }

        const comments = results.docs.map(comment => 
            ({ id: comment.id, ...comment.data()}));

        return res.status(200).json({ comments })
    } catch(err) {
        return res.status(500).json({ message: 'Unexpected error occurred', error: err });
    }
}