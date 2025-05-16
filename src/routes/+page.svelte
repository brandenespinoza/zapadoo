<script lang="ts">
  import { onMount } from 'svelte';
  import { users } from '$lib/stores/users';
  import { currentUser } from '$lib/stores/currentUser';

  export let data: { users: any[] }; // Data from +page.server.ts

  let parents = [];
  let kids = [];
  let showCreateUser = false;
  let newUser = { name: '', role: 'child' };

  onMount(() => {
    users.set(data.users);
    parents = data.users.filter(u => u.role === 'parent');
    kids = data.users.filter(u => u.role === 'child');
  });

  function selectUser(user) {
    localStorage.setItem('zapadoo_user', JSON.stringify(user));
    currentUser.set(user);
    window.location.href = `/${user.role}`;
  }

  async function createUser() {
    if (!newUser.name.trim()) return;
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    window.location.reload();
  }
</script>

<div class="flex flex-col items-center min-h-screen py-40 px-4 font-sans">
  <h1 class="text-6xl font-extrabold mb-4">ZAPADOO</h1>
  <h2 class="text-lg font-medium text-gray-600 mb-12">a family job board</h2>

  <!-- Parent Buttons -->
  <div class="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-12 max-w-sm w-full justify-items-center mb-8 mx-auto">
    {#each parents as parent}
      <button
        class="w-48 h-48 rounded-lg bg-gray-100 border border-gray-400 text-lg font-bold cursor-pointer transition-colors duration-200 hover:bg-gray-200 hover:text-gray-700"
        on:click={() => selectUser(parent)}
      >
        {parent.name === "Mommy" ? "Mom" : parent.name === "Daddy" ? "Dad" : parent.name}
      </button>
    {/each}
  </div>

  <!-- Kid Buttons -->
  <div class="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-auto w-xlg justify-items-center mx-auto">
    {#each kids as kid}
      <button
        class="w-48 h-48 rounded-lg bg-gray-100 border border-gray-400 text-lg font-bold cursor-pointer transition-colors duration-200 hover:bg-gray-200 hover:text-gray-700"
        on:click={() => selectUser(kid)}
      >
        {kid.name}
      </button>
    {/each}
  </div>
<!-- Remove the old "+" button from inside the grid -->

<!-- Place this at the end of your main container, just before </div> -->
<button
  class="fixed bottom-6 right-6 z-50 bg-gray-100 text-gray-500 border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-200 transition"
  aria-label="Add New User"
  title="Add New User"
  on:click={() => showCreateUser = !showCreateUser}
  on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') showCreateUser = true; }}
>
</button>

{#if showCreateUser}
        <div class="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              class="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              on:click={() => showCreateUser = false}
              on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') showCreateUser = false; }}
            >
              ×
            </button>
            <h2 class="text-xl font-bold mb-4 text-center">Create New User</h2>
            <form
            on:submit|preventDefault={createUser}
            >
            <div class="mb-4">
              <label for="user-name" class="block text-sm font-medium mb-1">Name</label>
              <input
                id="user-name"
                class="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="ex. Mommy, Daddy, or Child's name"
                bind:value={newUser.name}
                required
              />
            </div>
            <div class="mb-4">
              <label for="user-role" class="block text-sm font-medium mb-1">Role</label>
              <select class="w-full border border-gray-300 rounded-lg px-3 py-2" id="user-role" bind:value={newUser.role}>
                <option value="child">Child</option>
                <option value="parent">Parent</option>
              </select>
            </div>
        <button
          class="w-full bg-blue-500 text-white font-bold py-2 rounded-lg hover:bg-blue-600 transition"
          type="submit"
        >
          Add User
        </button>
      </form>
    </div>
  </div>
{/if}
</div>