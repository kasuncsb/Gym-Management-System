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
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOADS_DIR, objectName), buffer);
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
    const fileHandle = await fs.open(filePath, 'r');
    const stream = fileHandle.createReadStream();
    return {
      body: stream as unknown as NodeJS.ReadableStream,
      contentType: 'application/octet-stream', // In dev, we can just return a generic stream type to safely serve frontend generic download requirements
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
