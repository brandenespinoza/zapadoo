<script lang="ts">
  import { onMount } from 'svelte';
  import { jobs } from '$lib/stores/jobs';
  import { currentUser } from '$lib/stores/currentUser';
  import { get } from 'svelte/store';
  import { writable } from 'svelte/store';

  const user = writable(null);
  let availableJobs = [];
  let claimedJobs = [];

  export let data: { jobs: any[]; users: any[] }; // Data from +page.server.ts

  function filterClaimedJobs(jobsArr, userId) {
    return jobsArr.filter(j => j.status === 'claimed' && j.child_id === userId);
  }

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
    claimedJobs = filterClaimedJobs(data.jobs, u?.id);
  });

  async function claimJob(id: string) {
    const job = availableJobs.find(j => j.id === id);
    if (job) {
      job.status = 'claimed'; // Change status to "claimed"
      job.child_id = get(currentUser)?.id || '';
      await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job)
      });
      const updatedJobs = await (await fetch('/api/jobs')).json();
      jobs.set(updatedJobs);
      availableJobs = updatedJobs.filter(j => j.status === 'open');
      claimedJobs = filterClaimedJobs(updatedJobs, get(currentUser)?.id);
    }
  };

  async function submitJob(id: string) {
  const job = claimedJobs.find(j => j.id === id);
  if (job) {
    job.status = 'inreview'; // Change status to "inreview"
    await fetch('/api/jobs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job)
    });
    const updatedJobs = await (await fetch('/api/jobs')).json();
    jobs.set(updatedJobs);
    availableJobs = updatedJobs.filter(j => j.status === 'open');
    claimedJobs = filterClaimedJobs(updatedJobs, get(currentUser)?.id);
  }
};
async function unclaimJob(id: string) {
  const job = claimedJobs.find(j => j.id === id);
  if (job) {
    job.status = 'open';
    job.child_id = '';
    await fetch('/api/jobs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job)
    });
    const updatedJobs = await (await fetch('/api/jobs')).json();
    jobs.set(updatedJobs);
    availableJobs = updatedJobs.filter(j => j.status === 'open');
    claimedJobs = filterClaimedJobs(updatedJobs, get(currentUser)?.id);
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
    <h1 class="text-xl font-bold mb-4 mt-6 text-center text-blue-600">Pick a Job</h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
                By: {data.users.find(user => user.id === job.parent_id)?.name ?? 'Unassigned'}
              {:else}
                Unassigned
              {/if}
            </span>
            <button
              class="text-green-600 hover:underline"
              on:click={() => claimJob(job.id)}
              on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') claimJob(job.id); }}
            >
              CLAIM
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
  <div>
    <h1 class="text-xl font-bold mb-4 mt-6 text-center text-blue-600">Do the Work</h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {#each claimedJobs as job}
        <div class="border border-gray-400 rounded-lg p-4 flex flex-col">
          <div class="flex justify-between font-bold mb-2">
            <span>{job.title}</span>
            <span>${job.reward_usd}</span>
          </div>
          <p class="text-sm text-gray-700 mb-2">{job.description}</p>
            <div class="flex justify-between items-center font-bold text-sm mt-auto">
            <span class="text-gray-600">
                {#if job.child_id}
                {data.users.find(user => user.id === job.child_id)?.name ?? 'No child assigned'}
                {:else}
                No child assigned
                {/if}
            </span>
            <div>
                <button
                class="text-red-600 hover:underline mr-2"
                on:click={() => unclaimJob(job.id)}
                on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') unclaimJob(job.id); }}
                >
                UNCLAIM
                </button>
                <button
                class="text-green-600 hover:underline"
                on:click={() => submitJob(job.id)}
                on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') submitJob(job.id); }}
                >
                SUBMIT
                </button>
            </div>
            </div>
        </div>
      {/each}
    </div>
  </div>
<div>
  <h1 class="text-xl font-bold mb-4 mt-6 text-center text-blue-600">Get Paid</h1>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
    {#each $jobs.filter(job =>
    (job.child_id === get(currentUser)?.id) &&
    (job.status === 'inreview' || job.status === 'paid')
    ) as job}
      <div class="border border-gray-400 rounded-lg p-4 flex flex-col">
        <div class="flex justify-between font-bold mb-2">
          <span>{job.title}</span>
          <span>${job.reward_usd}</span>
        </div>
        <p class="text-sm text-gray-700 mb-2">{job.description}</p>
            <div class="flex justify-between items-center font-bold text-sm mt-auto">
            <span class="text-gray-600">
                {#if job.child_id}
                {data.users.find(user => user.id === job.child_id)?.name ?? 'No child assigned'}
                {:else}
                No child assigned
                {/if}
            </span>
            {#if job.status === 'inreview'}
                <span class="text-yellow-600 ml-auto">IN REVIEW</span>
            {:else if job.status === 'paid'}
                <span class="text-blue-600 ml-auto">PAID</span>
            {/if}
            </div>
      </div>
    {/each}
  </div>
</div>
</div>