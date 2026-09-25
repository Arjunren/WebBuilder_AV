import { Router } from 'express';
import multer from 'multer';

const allowed = {
  'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
  'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/webp': [Buffer.from('RIFF')],
};

function startsWith(buffer, signature) {
  return buffer.subarray(0, signature.length).equals(signature);
}

export function assetsRouter(maxBytes = 5 * 1024 * 1024) {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1, fields: 0 },
    fileFilter: (_request, file, callback) => callback(null, Boolean(allowed[file.mimetype])),
  });
  router.post('/', upload.single('image'), (request, response) => {
    const file = request.file;
    if (!file || !allowed[file.mimetype]?.some((signature) => startsWith(file.buffer, signature))) {
      return response.status(415).json({ error: 'Upload a valid PNG, JPEG, or WebP image.' });
    }
    if (file.mimetype === 'image/webp' && file.buffer.subarray(8, 12).toString() !== 'WEBP') {
      return response.status(415).json({ error: 'The WebP file signature is invalid.' });
    }
    const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    return response.status(201).json({
      asset: {
        id: `asset_${crypto.randomUUID()}`,
        name: file.originalname.replace(/[^a-z0-9._-]/gi, '-').slice(0, 100),
        type: file.mimetype,
        size: file.size,
        dataUrl,
      },
      warning:
        file.size > 1024 * 1024 ? 'Large images increase the exported HTML file size.' : null,
    });
  });
  return router;
}
