import { useState } from "react";

const FALLBACK_IMAGE = "/defaultProfilePic.jpg";

export function useImageFallback(initialSrc?: string) {
  const [imageSrc, setImageSrc] = useState(initialSrc || FALLBACK_IMAGE);

  const handleImageError = () => {
    setImageSrc(FALLBACK_IMAGE);
  };

  return {
    imageSrc,
    handleImageError,
    setImageSrc,
  };
}
