import { db } from '../config/database.js';
import { entityLifecycle } from '../db/schema.js';
import { ids } from './id.js';

type DbLike = Pick<typeof db, 'insert'>;

/** Insert a lifecycle row; returns its id for FK on the owning entity. Works with `db` or transaction client. */
export async function insertLifecycleRow(client: DbLike = db, id?: string): Promise<string> {
  const lid = id ?? ids.uuid();
  await client.insert(entityLifecycle).values({ id: lid });
  return lid;
}
