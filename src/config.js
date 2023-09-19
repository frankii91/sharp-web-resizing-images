export const PORT = process.env.SHARP_PORT || 8080;
export const HOST = process.env.SHARP_HOST || '0.0.0.0';


// CLOUDFLARE R2 / AWS S3

export const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID || '';
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
export const AWS_BUCKET = process.env.AWS_BUCKET || 'test';
export const AWS_HOST = process.env.AWS_HOST || 'r2.cloudflarestorage.com';
