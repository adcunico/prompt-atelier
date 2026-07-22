export const IMAGES = [
  { name: 'Image I', src: 'assets/images/photo-1518611540400-6b85a0704342.avif' },
  { name: 'Image II', src: 'assets/images/photo-1525304937537-4d586f394674.avif' },
  { name: 'Image III', src: 'assets/images/photo-1536766768598-e09213fdcf22.avif' },
];

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Draw image cover-fit into an offscreen canvas of (w, h) and return its ImageData.
export function imageToData(img, w, h) {
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const ctx = off.getContext('2d', { willReadFrequently: true });
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return ctx.getImageData(0, 0, w, h);
}
