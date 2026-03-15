/**
 * Oracle Cloud Infrastructure — Object Storage helper.
 * Objects are PRIVATE — never publicly accessible.
 * Admin downloads are proxied through the backend.
 */
import * as common from 'oci-common';
import * as objectstorage from 'oci-objectstorage';
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
    const contentType = objectName.toLowerCase().endsWith('.jpg') || objectName.toLowerCase().endsWith('.jpeg')
      ? 'image/jpeg'
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

  return {
    body: response.value as unknown as NodeJS.ReadableStream,
    contentType: response.contentType ?? 'application/octet-stream',
  };
}
