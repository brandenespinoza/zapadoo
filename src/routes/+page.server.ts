import { loadJSON } from '\$lib/utils/jsonStorage';

export async function load() {
  const allUsers = await loadJSON('users.json');
  return {
    users: allUsers
  };
}