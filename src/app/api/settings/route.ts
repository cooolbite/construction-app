import { NextResponse } from 'next/server';
import { queryAll, execute } from '@/lib/db';

export async function GET() {
  try {
    const settingsRows = queryAll<{ key: string; value: string }>('SELECT key, value FROM settings');
    const settings: Record<string, string> = {};
    for (const r of settingsRows) {
      settings[r.key] = r.value;
    }

    const users = queryAll('SELECT id, username, name, role, active, created_at FROM users');
    const warehouses = queryAll('SELECT * FROM warehouses');
    const units = queryAll('SELECT * FROM units');
    const categories = queryAll('SELECT * FROM categories');

    return NextResponse.json({
      settings,
      users,
      warehouses,
      units,
      categories
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    for (const [key, val] of Object.entries(body)) {
      execute('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [
        key, String(val)
      ]);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
