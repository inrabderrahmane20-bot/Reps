import type { Db } from './types';
import { newId } from './db';

/** Push a notification onto an already-loaded Db (call inside updateDb's mutator). */
export function pushNotification(
  db: Db,
  userId: string,
  type: string,
  content: string,
  link: string | null = null
) {
  db.notifications.unshift({
    id: newId('nt'),
    userId,
    type,
    content,
    link,
    read: false,
    createdAt: new Date().toISOString(),
  });
}
