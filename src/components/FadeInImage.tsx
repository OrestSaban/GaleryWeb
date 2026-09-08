"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const FIT = {
  cover: "object-cover",
  contain: "object-contain",
} as const;

/**
 * next/image wrapper that fades the picture in once it has decoded, over a
 * woven-paper placeholder.
 *
 * The wrapper is `relative` because every caller passes `fill`, which renders
 * an absolutely-positioned image: without a positioned parent it would resolve
 * against whatever ancestor happens to be positioned.
 */
export function FadeInImage({
  className = "",
  fit = "cover",
  ...props
}: ImageProps & { fit?: keyof typeof FIT }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <span
      className="relative block h-full w-full overflow-hidden"
      style={{
        background:
          "repeating-linear-gradient(112deg, #EDE9E1 0 9px, #F4F1EA 9px 18px)",
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/alt-text -- `alt` is required by ImageProps and always supplied by the caller */}
      <Image
        {...props}
        onLoad={() => setLoaded(true)}
        data-loaded={loaded ? "true" : "false"}
        className={`img-fade h-full w-full ${FIT[fit]} ${className}`}
      />
    </span>
  );
}
