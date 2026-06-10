import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeAzureUrls<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === "string") {
    if (obj.includes("webprojazure.blob.core.windows.net")) {
      try {
        const urlObj = new URL(obj);
        const parts = urlObj.pathname.split('/');
        const filename = parts[parts.length - 1];
        if (filename) {
          const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dnda7l0hx";
          return `https://res.cloudinary.com/${cloudName}/image/upload/linknest/${filename}` as unknown as T;
        }
      } catch {
        return "/defaultProfilePic.jpg" as unknown as T;
      }
      return "/defaultProfilePic.jpg" as unknown as T;
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeAzureUrls(item)) as unknown as T;
  }
  if (typeof obj === "object") {
    const record = obj as Record<string, unknown>;
    const newObj: Record<string, unknown> = {};
    for (const key in record) {
      if (Object.prototype.hasOwnProperty.call(record, key)) {
        newObj[key] = sanitizeAzureUrls(record[key]);
      }
    }
    return newObj as unknown as T;
  }
  return obj;
}
