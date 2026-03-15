/**
 * Oracle Cloud Infrastructure — Object Storage helper.
 * Objects are PRIVATE — never publicly accessible.
 * Admin downloads are proxied through the backend.
 */
import * as common from 'oci-common';
import * as objectstorage from 'oci-objectstorage';
import { Readable } from 'stream';
import { env } from '../config/env.js';
import fs from 'fs/promises';
import path from 'path';

let client: objectstorage.ObjectStorageClient | null = null;
const UPLOADS_DIR = '/tmp/uploads';

async function getClient(): Promise<objectstorage.ObjectStorageClient> {
  if (client) return client;

  // Recommended for production on OCI VMs — no secret keys in .env
  const authProviderBuilder = new common.InstancePrincipalsAuthenticationDetailsProviderBuilder();
  const provider = await authProviderBuilder.build();

  client = new objectstorage.ObjectStorageClient({ authenticationDetailsProvider: provider });
  return client;
}

/**
 * Upload a file buffer to OCI Object Storage (private visibility).
 * Returns the object name (path within the bucket) — NOT a public URL.
 * The object name is stored in the DB; downloads go through the backend proxy.
 */
export async function uploadFile(
  buffer: Buffer,
  objectName: string,
  contentType: string,
): Promise<string> {
  if (env.NODE_ENV === 'development') {
    const fullPath = path.join(UPLOADS_DIR, objectName);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, buffer);
    return objectName;
  }

  const ociClient = await getClient();
  await ociClient.putObject({
    namespaceName: env.OCI_NAMESPACE,
    bucketName: env.OCI_BUCKET,
    objectName,
    putObjectBody: buffer,
    contentLength: buffer.length,
    contentType,
  });
  // Return object name only — no public URL ever generated
  return objectName;
}

/**
 * Stream an object from OCI Object Storage.
 * Used by the admin download proxy endpoint.
 */
export async function downloadFile(
  objectName: string,
): Promise<{ body: NodeJS.ReadableStream; contentType: string }> {
  if (env.NODE_ENV === 'development') {
    const filePath = path.join(UPLOADS_DIR, objectName);
    const stat = await fs.stat(filePath).catch(() => null);
    if (!stat?.isFile()) {
      const err = new Error(`ENOENT: no such file or directory, open '${filePath}'`);
      (err as NodeJS.ErrnoException).code = 'ENOENT';
      throw err;
    }
    const fileHandle = await fs.open(filePath, 'r');
    const stream = fileHandle.createReadStream();
    const lower = objectName.toLowerCase();
    const contentType = lower.endsWith('.jpg') || lower.endsWith('.jpeg') ? 'image/jpeg'
      : lower.endsWith('.png') ? 'image/png'
      : lower.endsWith('.gif') ? 'image/gif'
      : lower.endsWith('.webp') ? 'image/webp'
      : 'application/octet-stream';
    return {
      body: stream as unknown as NodeJS.ReadableStream,
      contentType,
    };
  }

  const ociClient = await getClient();
  const response = await ociClient.getObject({
    namespaceName: env.OCI_NAMESPACE,
    bucketName: env.OCI_BUCKET,
    objectName,
  });

  const raw = response.value;
  const contentType = response.contentType ?? 'application/octet-stream';

  // OCI SDK may return Buffer or a non-Node stream in some environments — normalize to Node Readable.
  let body: NodeJS.ReadableStream;
  if (raw == null) {
    throw new Error('OCI getObject returned no body');
  }
  if (Buffer.isBuffer(raw)) {
    body = Readable.from(raw);
  } else if (typeof (raw as NodeJS.ReadableStream).pipe === 'function' && typeof (raw as NodeJS.ReadableStream).on === 'function') {
    body = raw as NodeJS.ReadableStream;
  } else if (raw instanceof Uint8Array) {
    body = Readable.from(Buffer.from(raw));
  } else if (typeof ArrayBuffer !== 'undefined' && raw instanceof ArrayBuffer) {
    body = Readable.from(Buffer.from(new Uint8Array(raw)));
  } else {
    throw new Error('OCI getObject returned unsupported body type; expected Buffer or Node stream');
  }

  return { body, contentType };
}
