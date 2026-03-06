/**
 * Oracle Cloud Infrastructure — Object Storage helper.
 * Objects are PRIVATE — never publicly accessible.
 * Admin downloads are proxied through the backend.
 */
import * as common from 'oci-common';
import * as objectstorage from 'oci-objectstorage';
import { env } from '../config/env.js';

let client: objectstorage.ObjectStorageClient | null = null;

function getClient(): objectstorage.ObjectStorageClient {
  if (client) return client;
  const provider = new common.SimpleAuthenticationDetailsProvider(
    env.OCI_TENANCY_ID,
    env.OCI_USER_ID,
    env.OCI_FINGERPRINT,
    env.OCI_PRIVATE_KEY.replace(/\\n/g, '\n'),
    null,
    common.Region.fromRegionId(env.OCI_REGION),
  );
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
  const ociClient = getClient();
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
  const ociClient = getClient();
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
