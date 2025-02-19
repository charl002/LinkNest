import { BlobServiceClient } from "@azure/storage-blob";
import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";
import formidable from "formidable";

import path from "path";
import fs from "fs";
import { NextApiRequest } from "next";

// Azure Storage Configuration
const sasToken = process.env.AZURE_SAS;
const containerName = process.env.AZURE_BLOB_CONTAINER || "helloblob";
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT || "webprojazure";
const blobPublicUrl = `https://${storageAccountName}.blob.core.windows.net/${containerName}/`;

const blobService = new BlobServiceClient(
  `https://${storageAccountName}.blob.core.windows.net/?${sasToken}`
);
const containerClient = blobService.getContainerClient(containerName);

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req: NextApiRequest) => {
  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
    const form = formidable({
      uploadDir: path.join(process.cwd(), "/public/uploads"),
      keepExtensions: true,
      multiples: false,
    });

    // Ensure upload directory exists
    if (!fs.existsSync(path.join(process.cwd(), "/public/uploads"))) {
      fs.mkdirSync(path.join(process.cwd(), "/public/uploads"), { recursive: true });
    }

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

export async function POST(req: Request, Req:NextApiRequest) {
  try {
    // Parse the form to get fields and files
    const { fields, files } = await parseForm(Req);
    const fileArray = files as Record<string, formidable.File[]>;
    const file = fileArray.file?.[0];

    // Extract the form fields
    const { username, title, text, date, tags } = fields;

    if (!username || !title || !text || !date) {
      return NextResponse.json({ message: "Username, Title, Text and Date are required." }, { status: 400 });
    }

    // Initialize the post data
    const data = { username, title, text, date, tags: tags || [], likes: 0, comments: [] };

    // If there's a file, upload it to Azure
    let fileUrl = null;
    if (file) {
      const fileBuffer = fs.readFileSync(file.filepath);
      const blobName = file.originalFilename || `upload-${Date.now()}`;
      const blobClient = containerClient.getBlockBlobClient(blobName);

      // Upload file to Azure Blob Storage
      const options = { blobHTTPHeaders: { blobContentType: file.mimetype || undefined } };
      await blobClient.uploadData(fileBuffer, options);

      // Delete local file after upload
      fs.unlinkSync(file.filepath);

      fileUrl = blobPublicUrl + blobName; // Get the file URL
    }

    // Add post data to Firebase
    const postData = { ...data, file: fileUrl };
    const { result: docId, error } = await addData("posts", postData);

    if (error) {
      return NextResponse.json({ message: "Error adding post", error }, { status: 500 });
    }

    return NextResponse.json({ message: "Post added successfully", id: docId }, { status: 200 });
  } catch (err) {
    console.error("Error uploading post:", err);
    return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
  }
}
