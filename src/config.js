import * as path from 'path';

export const PORT = process.env.SHARP_PORT || 8080;
export const HOST = process.env.SHARP_HOST || '0.0.0.0';

export const __dirImagesLocal = path.normalize("/app/images") ;
export const __dirImagesMount = process.env.SHARP_IMAGES_MOUNT
    ? path.normalize(process.env.SHARP_IMAGES_MOUNT)
    : path.normalize("/mnt/images");

export const __dirImagesResultLocal = path.normalize("/app/result");

export const __dirImagesResultMount = process.env.SHARP_IMAGES_RESULT_MOUNT
    ? path.normalize(process.env.SHARP_IMAGES_RESULT_MOUNT)
    : path.normalize("/mnt/result");


export const META_TAGS = process.env.META_TAGS || true;

// CLOUDFLARE R2 / AWS S3

export const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID || 'xxxxxxxx';
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'xxxxxxxx';
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'xxxxxxxx';
export const AWS_BUCKET = process.env.AWS_BUCKET || 'test';
export const AWS_HOST = process.env.AWS_HOST || 'r2.cloudflarestorage.com';

// FTP
export const FTP_HOST = process.env.FTP_HOST || 'xxxxxxxx';
export const FTP_USER = process.env.FTP_USER || 'xxxxxxxx';
export const FTP_PASSWORD = process.env.FTP_PASSWORD || 'xxxxxxxx;
export const FTP_BaseDirImagesResult = process.env.FTP_BaseDirImagesResult
    ? path.normalize(process.env.FTP_BaseDirImagesResult)
    : path.normalize("/testX");