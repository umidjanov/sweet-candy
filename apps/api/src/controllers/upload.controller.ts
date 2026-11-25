import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { sendSuccess, sendError } from '../utils/response';
import { env, getPublicApiOrigin } from '../config/env';
import { prisma } from '../config/database';
import { uploadDir } from '../middleware/upload';

function buildFileUrl(req: Request, filename: string): string {
  const host = req.get('x-forwarded-host') || req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    return `${proto}://${host}/uploads/${filename}`;
  }
  if (host) {
    return `${proto}://${host}/uploads/${filename}`;
  }
  const baseUrl = process.env.VERCEL ? getPublicApiOrigin() : env.API_URL;
  return `${baseUrl.replace(/\/+$/, '')}/uploads/${filename}`;
}

async function persistUploadedFile(file: Express.Multer.File): Promise<string> {
  const rawExt = path.extname(file.originalname).toLowerCase();
  const ext = rawExt && /^\.[a-z0-9]{1,5}$/.test(rawExt) ? rawExt : '.jpg';
  const filename = `${uuidv4()}${ext}`;

  await prisma.uploadedFile.create({
    data: {
      filename,
      mimeType: file.mimetype || 'image/jpeg',
      data: file.buffer,
      size: file.size,
    },
  });

  if (!process.env.VERCEL) {
    try {
      await fs.promises.writeFile(path.join(uploadDir, filename), file.buffer);
    } catch {
      // Non-fatal in read-only environments; DB copy is authoritative
    }
  }

  return filename;
}

export class UploadController {
  static async uploadImage(req: Request, res: Response) {
    if (!req.file) {
      return sendError(res, 'No image file uploaded', 400, 'NO_FILE');
    }

    try {
      const filename = await persistUploadedFile(req.file);
      const fileUrl = buildFileUrl(req, filename);
      return sendSuccess(
        res,
        {
          url: fileUrl,
          filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
        'Image uploaded successfully',
        201
      );
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to store uploaded image', 500, 'UPLOAD_FAILED');
    }
  }

  static async uploadMultipleImages(req: Request, res: Response) {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return sendError(res, 'No image files uploaded', 400, 'NO_FILES');
    }

    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const filename = await persistUploadedFile(file);
          return {
            url: buildFileUrl(req, filename),
            filename,
            size: file.size,
            mimetype: file.mimetype,
          };
        })
      );

      return sendSuccess(
        res,
        {
          files: uploaded,
          urls: uploaded.map((f) => f.url),
        },
        'Images uploaded successfully',
        201
      );
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to store uploaded images', 500, 'UPLOAD_FAILED');
    }
  }
}
