import { getDb } from '@/db';
import { settings } from '@/db/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  const db = getDb();
  const allSettings = await db.select().from(settings);
  return NextResponse.json({ settings: allSettings });
}
