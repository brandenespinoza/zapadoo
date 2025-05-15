<script lang="ts">
  import { onMount } from 'svelte';
  import { loadJSON } from '$lib/utils/jsonStorage';
  import { users } from '$lib/stores/users';
  import { currentUser } from '$lib/stores/currentUser';

  let parents = [];
  let kids = [];

  onMount(async () => {
    // Make sure loadJSON reads from 'data/users.json'
    const allUsers = await loadJSON('users.json');
    users.set(allUsers);
    parents = allUsers.filter(u => u.role === 'parent');
    kids = allUsers.filter(u => u.role === 'child');
  });

  function selectUser(user) {
    localStorage.setItem('zapadoo_user', JSON.stringify(user));
    currentUser.set(user);
    window.location.href = `/${user.role}`;
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
  <div class="grid  grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-auto w-xlg justify-items-center mx-auto">
    {#each kids as kid}
      <button
        class="w-48 h-48 rounded-lg bg-gray-100 border border-gray-400 text-lg font-bold cursor-pointer transition-colors duration-200 hover:bg-gray-200 hover:text-gray-700"
        on:click={() => selectUser(kid)}
      >
        {kid.name}
      </button>
    {/each}
  </div>
</div>