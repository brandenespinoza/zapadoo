import { readFile } from 'fs/promises';
import { join } from 'path';

export async function loadJSON(filename: string) {
  const filePath = join('data', filename);
  const data = await readFile(filePath, 'utf-8');
  return JSON.parse(data);
}