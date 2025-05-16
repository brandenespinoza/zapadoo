import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

const filePath = join('data', 'users.json');

async function loadUsers() {
  try {
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveUsers(users: any[]) {
  await writeFile(filePath, JSON.stringify(users, null, 2), 'utf-8');
}

export async function GET() {
  const users = await loadUsers();
  return new Response(JSON.stringify(users), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST({ request }) {
  try {
    const newUser = await request.json();
    const users = await loadUsers();
    // Assign a unique string id
    newUser.id = users.length > 0
      ? (Math.max(...users.map(u => Number(u.id) || 0)) + 1).toString()
      : Date.now().toString();
    users.push(newUser);
    await saveUsers(users);
    return new Response(JSON.stringify(newUser), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('POST /api/users error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create user' }), { status: 500 });
  }
}