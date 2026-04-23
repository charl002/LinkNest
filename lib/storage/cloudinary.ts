import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

function normalizeFileName(fileName: string) {
  const cleaned = fileName
    .replace(/[^a-zA-Z0-9-_\.]/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/^[-_.]+|[-_.]+$/g, "");

  return cleaned.replace(/\.[^/.]+$/, "");
}

export function getCloudinaryPublicIdFromUrl(fileUrl: string): string | null {
  try {
    const parsed = new URL(fileUrl);
    // Match pattern: /resource_type/upload/version/folder/filename or /resource_type/upload/folder/filename
    const match = parsed.pathname.match(
      /\/(?:image|video|raw)\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(.+)\.[^/.]+$/
    );
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  folder = "linknest"
): Promise<{ url: string; publicId: string }> {
  const normalizedFileName = normalizeFileName(fileName);
  const publicId = `${folder}/${Date.now()}-${normalizedFileName}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "auto",
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result || !result.secure_url || !result.public_id) {
          return reject(new Error("Cloudinary upload returned an invalid response"));
        }

        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

export function getCloudinaryResourceTypeFromUrl(fileUrl: string): string {
  try {
    const parsed = new URL(fileUrl);
    if (parsed.pathname.includes('/video/')) {
      return 'video';
    } else if (parsed.pathname.includes('/image/')) {
      return 'image';
    } else if (parsed.pathname.includes('/raw/')) {
      return 'raw';
    }
    return 'image'; // default fallback
  } catch {
    return 'image';
  }
}

export async function deleteFile(fileUrl: string): Promise<void> {
  const publicId = getCloudinaryPublicIdFromUrl(fileUrl);
  if (!publicId) {
    return;
  }

  const resourceType = getCloudinaryResourceTypeFromUrl(fileUrl);

  const result = await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
    resource_type: resourceType,
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary deletion failed: ${result.result}`);
  }
}
