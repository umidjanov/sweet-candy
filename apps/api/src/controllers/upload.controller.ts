import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { env } from '../config/env';

function buildFileUrl(req: Request, filename: string): string {
  const host = req.get('host');
  const baseUrl = host ? `${req.protocol}://${host}` : env.API_URL;
  return `${baseUrl}/uploads/${filename}`;
}

export class UploadController {
  static async uploadImage(req: Request, res: Response) {
    if (!req.file) {
      return sendError(res, 'No image file uploaded', 400, 'NO_FILE');
    }

    const fileUrl = buildFileUrl(req, req.file.filename);
    return sendSuccess(
      res,
      {
        url: fileUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
      'Image uploaded successfully',
      201
    );
  }

  static async uploadMultipleImages(req: Request, res: Response) {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return sendError(res, 'No image files uploaded', 400, 'NO_FILES');
    }

    const uploaded = files.map((file) => ({
      url: buildFileUrl(req, file.filename),
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    }));

    return sendSuccess(
      res,
      {
        files: uploaded,
        urls: uploaded.map((f) => f.url),
      },
      'Images uploaded successfully',
      201
    );
  }
}
