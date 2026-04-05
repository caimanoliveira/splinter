/**
 * Cloudflare R2 storage — S3-compatible API.
 *
 * R2 credentials live in env vars (EXPO_PUBLIC_R2_*).
 * We use the AWS SDK v3 S3 client pointed at the R2 endpoint.
 *
 * Security note: for production, prefer generating pre-signed PUT URLs
 * from a backend so that R2 credentials never ship in the app bundle.
 * For development / small teams this direct approach is fine.
 */
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import * as FileSystem from 'expo-file-system';

const ACCOUNT_ID = process.env['EXPO_PUBLIC_R2_ACCOUNT_ID'] ?? '';
const ACCESS_KEY_ID = process.env['EXPO_PUBLIC_R2_ACCESS_KEY_ID'] ?? '';
const SECRET_ACCESS_KEY = process.env['EXPO_PUBLIC_R2_SECRET_ACCESS_KEY'] ?? '';
const BUCKET = process.env['EXPO_PUBLIC_R2_BUCKET_NAME'] ?? 'pet-health-assets';
const PUBLIC_URL_BASE = (process.env['EXPO_PUBLIC_R2_PUBLIC_URL'] ?? '').replace(/\/$/, '');

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

/**
 * Upload a local file URI to R2.
 * Returns the public URL (requires the bucket to have public access enabled,
 * or a custom domain configured in R2).
 *
 * Path convention: `{userId}/{timestamp}-{filename}`
 */
export async function uploadFile(opts: {
  userId: string;
  localUri: string;
  mimeType?: string;
  folder?: 'pet-photos' | 'record-attachments';
}): Promise<string> {
  const filename = opts.localUri.split('/').pop() ?? `${Date.now()}`;
  const folder = opts.folder ?? 'uploads';
  const key = `${folder}/${opts.userId}/${Date.now()}-${filename}`;

  // Read file as base64 then convert to Uint8Array
  const base64 = await FileSystem.readAsStringAsync(opts.localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: binary,
      ContentType: opts.mimeType ?? 'image/jpeg',
    }),
  );

  if (!PUBLIC_URL_BASE) {
    // Fallback: construct the R2 public domain URL
    return `https://${ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET}/${key}`;
  }
  return `${PUBLIC_URL_BASE}/${key}`;
}

/**
 * Delete a file from R2 by its public URL.
 */
export async function deleteFile(publicUrl: string): Promise<void> {
  // Extract key from URL: everything after the bucket/domain portion
  const urlObj = new URL(publicUrl);
  const key = urlObj.pathname.replace(/^\//, '');
  if (!key) return;

  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
