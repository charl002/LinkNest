import { NextApiRequest, NextApiResponse } from "next";
import { BlobServiceClient } from "@azure/storage-blob";
import formidable from "formidable";
import path from "path";
import fs from "fs";
import addData from "@/firebase/firestore/addData";

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
    bodyParser: false, // Disable body parsing so we can handle the form manually
  },
};

// Helper function to parse form data
const parseForm = (req: NextApiRequest) => {
  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
    const form = formidable({
      uploadDir: path.join(process.cwd(), "/public/uploads"),
      keepExtensions: true,
      multiples: false,
    });

    // Ensure the uploads directory exists
    const uploadDir = path.join(process.cwd(), "/public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error("Error parsing form:", err);
        reject(err);
      } else {
        console.log("Form fields:", fields);
        console.log("Uploaded files:", files);
        resolve({ fields, files });
      }
    });
  });
};

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Parse form data manually
    const { fields, files } = await parseForm(req);
    const { username, description } = fields;
    const fileArray = files as Record<string, formidable.File[]>;
    const file = fileArray.file?.[0];

    // Debugging the fields and file
    console.log("Username:", username);
    console.log("Description:", description);
    console.log("File data:", file);

    // Validate the required fields
    if (!username || !description) {
      return res.status(400).json({ message: "Username and description are required" });
    }

    let fileUrl = null;

    // Handle file upload to Azure
    if (file) {
      const fileBuffer = fs.readFileSync(file.filepath);
      const blobName = file.originalFilename || `upload-${Date.now()}`;
      const blobClient = containerClient.getBlockBlobClient(blobName);

      // Debugging the Azure upload details
      console.log("Uploading file to Azure Blob Storage:", blobName);
      const options = { blobHTTPHeaders: { blobContentType: file.mimetype || "application/octet-stream" } };

      try {
        await blobClient.uploadData(fileBuffer, options);
        fs.unlinkSync(file.filepath); // Clean up the temporary file
        fileUrl = blobPublicUrl + blobName;
        console.log("File uploaded successfully. URL:", fileUrl);
      } catch (uploadError) {
        console.error("Error uploading file to Azure:", uploadError);
        return res.status(500).json({ message: "Error uploading file to Azure", error: uploadError });
      }
    }

    const postData = {
      username: String(username),
      description: String(description),
      fileUrl,
      createdAt: new Date().toISOString(),
    };

    // Debugging postData before saving
    console.log("Post Data:", postData);

    // Insert post data into Firestore
    const { result: postId, error } = await addData("posts", postData);

    if (error) {
      console.error("Error saving post to Firestore:", error);
      return res.status(500).json({ message: "Error saving post", error });
    }

    return res.status(200).json({ message: "Post uploaded successfully", postId, fileUrl });
  } catch (error) {
    console.error("Error uploading post:", error);
    return res.status(500).json({ message: "Unexpected error occurred", error });
  }
}
