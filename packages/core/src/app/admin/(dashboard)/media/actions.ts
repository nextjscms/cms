'use server';

import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { auth } from '@/auth';

export async function getMediaSettingsAction() {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  const db = getDb();
  
  const keys = [
    'media.storage.driver',
    'media.s3.bucketName',
    'media.s3.publicUrl',
    'media.s3.region',
    'media.s3.endpoint',
    'media.s3.accessKeyId',
    'media.s3.secretAccessKey'
  ];

  const results = await db.select().from(settings).where(inArray(settings.key, keys));
  
  const map: Record<string, string> = {
    driver: 's3',
    bucketName: '',
    publicUrl: '',
    region: 'auto',
    endpoint: '',
    accessKeyId: '',
    secretAccessKey: ''
  };

  results.forEach((row: any) => {
    if (row.key === 'media.storage.driver') map.driver = row.value || 's3';
    if (row.key === 'media.s3.bucketName') map.bucketName = row.value || '';
    if (row.key === 'media.s3.publicUrl') map.publicUrl = row.value || '';
    if (row.key === 'media.s3.region') map.region = row.value || 'auto';
    if (row.key === 'media.s3.endpoint') map.endpoint = row.value || '';
    if (row.key === 'media.s3.accessKeyId') map.accessKeyId = row.value ? '••••••••••••' : '';
    if (row.key === 'media.s3.secretAccessKey') map.secretAccessKey = row.value ? '••••••••••••' : '';
  });

  return map;
}

export async function saveMediaSettingsAction(data: Record<string, string>) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  const db = getDb();

  const toSave = [
    { key: 'media.storage.driver', value: data.driver || 's3' },
    { key: 'media.s3.bucketName', value: data.bucketName || '' },
    { key: 'media.s3.publicUrl', value: data.publicUrl || '' },
    { key: 'media.s3.region', value: data.region || 'auto' },
    { key: 'media.s3.endpoint', value: data.endpoint || '' },
  ];

  if (data.accessKeyId && data.accessKeyId !== '••••••••••••') {
    toSave.push({ key: 'media.s3.accessKeyId', value: data.accessKeyId });
  }

  if (data.secretAccessKey && data.secretAccessKey !== '••••••••••••') {
    toSave.push({ key: 'media.s3.secretAccessKey', value: data.secretAccessKey });
  }

  for (const item of toSave) {
    await db.insert(settings)
      .values({ key: item.key, value: item.value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: item.value, updatedAt: new Date() }
      });
  }

  return { success: true };
}
