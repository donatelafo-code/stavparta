import React from 'react';
import { resolveResponsiveImageSources } from '../shared/responsiveImages';

export interface ResponsiveImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  defaultWidth?: number;
  defaultHeight?: number;
  pictureClassName?: string;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  defaultWidth,
  defaultHeight,
  pictureClassName,
  width,
  height,
  loading,
  decoding,
  fetchPriority,
  ...imgProps
}) => {
  const resolved = resolveResponsiveImageSources(src);
  const resolvedWidth = width ?? resolved.width ?? defaultWidth;
  const resolvedHeight = height ?? resolved.height ?? defaultHeight;
  const resolvedLoading = loading ?? (priority ? 'eager' : 'lazy');
  const resolvedDecoding = decoding ?? (priority ? 'sync' : 'async');
  const resolvedFetchPriority = fetchPriority ?? (priority ? 'high' : undefined);

  if (!resolved.avifSrcSet && !resolved.webpSrcSet) {
    return (
      <img
        src={resolved.fallbackSrc}
        alt={alt}
        width={resolvedWidth}
        height={resolvedHeight}
        loading={resolvedLoading}
        decoding={resolvedDecoding}
        fetchPriority={resolvedFetchPriority}
        {...imgProps}
      />
    );
  }

  return (
    <picture className={pictureClassName}>
      {resolved.avifSrcSet && (
        <source type="image/avif" srcSet={resolved.avifSrcSet} sizes={sizes} />
      )}
      {resolved.webpSrcSet && (
        <source type="image/webp" srcSet={resolved.webpSrcSet} sizes={sizes} />
      )}
      <img
        src={resolved.fallbackSrc}
        alt={alt}
        width={resolvedWidth}
        height={resolvedHeight}
        loading={resolvedLoading}
        decoding={resolvedDecoding}
        fetchPriority={resolvedFetchPriority}
        {...imgProps}
      />
    </picture>
  );
};
