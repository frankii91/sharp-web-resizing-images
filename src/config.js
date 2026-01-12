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
export const RESULT_MULTI_SAVE = process.env.RESULT_MULTI_SAVE || true;


// CLOUDFLARE R2 / AWS S3

export const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID || '2a9e44496c2deeaea2f25ee0fde9c771';
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '48401a713e2552455ca290488e3e0038';
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '9ad61ab369edccf95c3cc5924f3d3d0f3b01304cfe1708501410d0b8692dec05';
export const AWS_BUCKET = process.env.AWS_BUCKET || 'test';
export const AWS_HOST = process.env.AWS_HOST || 'r2.cloudflarestorage.com';

// FTP
export const FTP_HOST = process.env.FTP_HOST || 's21.mydevil.net';
export const FTP_USER = process.env.FTP_USER || 'f1304_pub';
export const FTP_PASSWORD = process.env.FTP_PASSWORD || 'lTnc4Gddi9XKC2cdp3Th';
export const FTP_BaseDirImagesResult = process.env.FTP_BaseDirImagesResult
    ? path.normalize(process.env.FTP_BaseDirImagesResult)
    : path.normalize("/testX");