import { writable } from 'svelte/store';

interface User {
  id: string;
  name: string;
  role: string;
}

export const currentUser = writable<User | null>(null);
