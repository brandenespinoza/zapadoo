import { writeFile } from 'fs/promises';
import { join } from 'path';

const dataDir = process.env.DATA_PATH || '/app/data';

export async function POST({ request }) {
  const data = await request.json();
  await writeFile(join(dataDir, 'data.json'), JSON.stringify(data, null, 2));
  return new Response('Success', { status: 200 });
}