<script lang="ts">
  import { onMount } from 'svelte';
  import { jobs } from '$lib/stores/jobs';
  import { currentUser } from '$lib/stores/currentUser';
  import { get } from 'svelte/store';
  import { writable } from 'svelte/store';

  const user = writable(null);
  let availableJobs = [];

  export let data: { jobs: any[]; users: any[] }; // Data from +page.server.ts

  onMount(() => {
    let u = get(currentUser);
    if (!u?.id) {
      const stored = localStorage.getItem('zapadoo_user');
      if (stored) {
        u = JSON.parse(stored);
        currentUser.set(u);
      }
    }
    user.set(u);

    jobs.set(data.jobs);
    availableJobs = data.jobs.filter(j => j.status === 'open');
  });

  async function acceptJob(id: string) {
    const job = availableJobs.find(j => j.id === id);
    if (job) {
      job.status = 'pending';
      job.child_id = get(currentUser)?.id || '';
      await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job)
      });
      const updatedJobs = await (await fetch('/api/jobs')).json();
      jobs.set(updatedJobs);
      availableJobs = updatedJobs.filter(j => j.status === 'open');
    }
  }
</script>

<div class="px-4 py-8 max-w-4xl mx-auto font-sans">
  <div class="flex justify-between items-center mb-8">
    <h1 class="text-2xl font-bold">Jobs for {$user?.name || 'Child'}</h1>
    <button
      class="bg-gray-200 rounded-lg px-4 py-2 font-bold cursor-pointer hover:bg-gray-300 transition"
      on:click={() => {
        currentUser.set(null);
        localStorage.removeItem('zapadoo_user');
        window.location.href = '/';
      }}
      on:keydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          currentUser.set(null);
          localStorage.removeItem('zapadoo_user');
          window.location.href = '/';
        }
      }}
    >
      EXIT
    </button>
  </div>
  <div>
    {#each availableJobs as job}
      <div class="border border-gray-400 rounded-lg p-4 flex flex-col">
        <div class="flex justify-between font-bold mb-2">
          <span>{job.title}</span>
          <span>${job.reward_usd}</span>
        </div>
        <p class="text-sm text-gray-700 mb-2">{job.description}</p>
        <div class="flex justify-between items-center font-bold text-sm mt-auto">
          <span class="text-gray-600">
            {#if job.parent_id}
              Assigned by: {data.users.find(user => user.id === job.parent_id)?.name ?? 'Unassigned'}
            {:else}
              Unassigned
            {/if}
          </span>
          <button
            class="text-green-600 hover:underline"
            on:click={() => acceptJob(job.id)}
            on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') acceptJob(job.id); }}
          >
            ACCEPT
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>