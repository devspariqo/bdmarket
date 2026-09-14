/**
 * Client-side image upload helper.
 *
 * Shared by the product image uploader and the payment-logo manager so the
 * downscale + upload behaviour is identical in both. Lives in a separate module
 * because it touches `document` / `createImageBitmap` and must only be imported
 * from client components.
 */

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // keep in step with /api/admin/media

/**
 * Downscale a raster image before upload.
 *
 * A modern phone photo is 3–5 MB and 4000px wide; the largest place any of
 * these images render is a ~400px tile, so shipping the original is pure waste.
 * SVG is passed through untouched (resizing would rasterise it, destroying the
 * scalability that makes it worth using).
 */
export async function downscaleImage(file: File, maxWidth: number): Promise<File> {
  if (file.type === 'image/svg+xml' || !file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    if (bitmap.width <= maxWidth) {
      bitmap.close?.();
      return file;
    }

    const scale = maxWidth / bitmap.width;
    const canvas = document.createElement('canvas');
    canvas.width = maxWidth;
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    // Fully opaque PNGs compress far better as JPEG. Keep PNG only when the
    // alpha channel is actually doing something (logos, cut-out product shots).
    let hasAlpha = false;
    if (file.type === 'image/png') {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 250) {
          hasAlpha = true;
          break;
        }
      }
    }

    const outType =
      file.type === 'image/png' ? (hasAlpha ? 'image/png' : 'image/jpeg') : 'image/jpeg';
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, outType, outType === 'image/jpeg' ? 0.86 : undefined)
    );
    if (!blob || blob.size >= file.size) return file;

    const ext = outType === 'image/png' ? 'png' : 'jpg';
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.' + ext, { type: outType });
  } catch {
    return file; // decoding unsupported (e.g. WebP on very old Safari) — send as-is
  }
}

/**
 * Upload one file to the media library and return its public URL.
 * Throws with a human-readable message on failure.
 */
export async function uploadImage(file: File, maxWidth = 1400): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('larger than 8 MB');
  }
  const optimized = await downscaleImage(file, maxWidth);
  const body = new FormData();
  body.append('file', optimized);

  const res = await fetch('/api/admin/media', { method: 'POST', body });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'Upload failed');

  const url = data?.media?.url;
  if (!url) throw new Error('Upload returned no URL');
  return url;
}
