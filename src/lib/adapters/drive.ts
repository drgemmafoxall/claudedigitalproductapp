import 'server-only';
import crypto from 'crypto';

/**
 * Google Drive adapter — uploads generated images straight into Gemma's
 * "Marketing Image and Animation Library" Drive folder using a Google Cloud
 * service account. No OAuth consent flow, no user interaction required at
 * generation time — the service account just needs to be shared as an
 * Editor on the destination folder once, up front.
 *
 * One-time setup (see README §Google Drive integration):
 *   1. Create a Google Cloud project → Service Account → enable the Drive API.
 *   2. Create a JSON key for the service account.
 *   3. Share the destination Drive folder with the service account's
 *      client_email as an Editor.
 *   4. Set env vars:
 *        GOOGLE_SERVICE_ACCOUNT_KEY = <the full JSON key, as one line>
 *        GOOGLE_DRIVE_IMAGES_FOLDER_ID = <destination folder id>
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DRIVE_UPLOAD_URL =
  'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function getAccessToken(): Promise<string> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not set');
  const key: ServiceAccountKey = JSON.parse(raw);

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: key.client_email,
    scope: DRIVE_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = base64url(signer.sign(key.private_key));
  const assertion = `${unsigned}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token as string;
}

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
}

/** Uploads bytes into an arbitrary Drive folder. Throws on failure. */
export async function uploadBytesToDrive(
  bytes: Buffer,
  filename: string,
  mimeType: string,
  folderId: string,
): Promise<DriveUploadResult> {
  const accessToken = await getAccessToken();

  const metadata = { name: filename, parents: [folderId] };
  const boundary = `productfactory${Math.random().toString(16).slice(2)}`;
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n` +
    `Content-Transfer-Encoding: base64\r\n\r\n${bytes.toString('base64')}\r\n` +
    `--${boundary}--`;

  const res = await fetch(DRIVE_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!res.ok) throw new Error(`Drive upload failed: ${await res.text()}`);
  const data = await res.json();
  return { fileId: data.id, webViewLink: data.webViewLink };
}

/** Uploads a generated illustration into the images library folder. */
export async function uploadImageToDrive(
  bytes: Buffer,
  filename: string,
  mimeType: string,
): Promise<DriveUploadResult> {
  const folderId = process.env.GOOGLE_DRIVE_IMAGES_FOLDER_ID;
  if (!folderId) throw new Error('GOOGLE_DRIVE_IMAGES_FOLDER_ID not set');
  return uploadBytesToDrive(bytes, filename, mimeType, folderId);
}

/** Uploads a rendered PDF into the PDF exports folder. */
export async function uploadPdfToDrive(
  bytes: Buffer,
  filename: string,
): Promise<DriveUploadResult> {
  const folderId = process.env.GOOGLE_DRIVE_PDF_FOLDER_ID;
  if (!folderId) throw new Error('GOOGLE_DRIVE_PDF_FOLDER_ID not set');
  return uploadBytesToDrive(bytes, filename, 'application/pdf', folderId);
}
