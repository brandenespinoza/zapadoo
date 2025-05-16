echo "import { loadJSON } from '\$lib/utils/jsonStorage';

export async function load() {
  const jobs = await loadJSON('jobs.json');
  const users = await loadJSON('users.json');
  return {
    jobs,
    users
  };
}"