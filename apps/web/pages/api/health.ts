import type { NextApiRequest, NextApiResponse } from 'next';
import app from '../../../api/src/app';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  req.url = '/health';
  return (app as any)(req, res);
}
