<script lang="ts">
  import { onMount } from 'svelte';
  import { jobs } from '$lib/stores/jobs';
  import { currentUser } from '$lib/stores/currentUser';
  import { loadJSON } from '$lib/utils/jsonStorage';
  import { get } from 'svelte/store';

  let availableJobs = [];
  let completedJobs: { id: string; title: string; reward_usd: number; description: string; status: string; child_id?: string }[] = [];
  let user = null;

onMount(async () => {
  // Rehydrate currentUser from localStorage if not already set
  let u = get(currentUser);
  if (!u?.id) {
    const stored = localStorage.getItem('zapadoo_user');
    if (stored) {
      u = JSON.parse(stored);
      currentUser.set(u);
    }
  }
  user = u;

  // Fetch jobs
  const jobData = await loadJSON('jobs.json');
  jobs.set(jobData);

  // Filter available and completed jobs
  availableJobs = jobData.filter(j => j.status === 'open');
  completedJobs = jobData.filter(
    j => (j.status === 'pending' || j.status === 'paid') && j.child_id === user?.id
  );
});

  async function markJobAsDone(id: string) {
    // Find the job and update its status locally
    const job = availableJobs.find(j => j.id === id);
    if (job) {
      job.status = 'pending';
      job.child_id = user?.id;
      completedJobs = [...completedJobs, job];
      availableJobs = availableJobs.filter(j => j.id !== id);
    }

    // Call the backend API to update the job's status
    await fetch('/api/jobs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...job, status: 'pending', child_id: user?.id })
    });
  }
</script>

<div class="px-4 py-8 max-w-4xl mx-auto font-sans">
  <div class="flex justify-between items-center mb-8">
    <h1 class="text-2xl font-bold">{user?.name}, let’s make some money!</h1>
    <button
      class="bg-gray-200 rounded-lg px-4 py-2 font-bold cursor-pointer hover:bg-gray-300 transition"
      on:click={() => {
        currentUser.set(null); // Clear the currentUser store
        localStorage.removeItem('zapadoo_user'); // Clear user data from localStorage
        window.location.href = '/'; // Redirect to the homepage
      }}
    >
      EXIT
    </button>
  </div>

  <div>
    <h2 class="text-xl font-semibold mb-4 mt-6">Available Jobs</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {#each availableJobs as job}
        <div class="border border-gray-400 rounded-lg p-4 flex flex-col">
          <div class="flex justify-between font-bold mb-2">
            <span>{job.title}</span>
            <span>${job.reward_usd}</span>
          </div>
          <p class="text-sm text-gray-700 mb-2">{job.description}</p>
          <button
            class="text-green-600 font-semibold mt-auto self-end hover:underline"
            on:click={() => markJobAsDone(job.id)}
          >
            MARK AS DONE
          </button>
        </div>
      {/each}
    </div>
  </div>
    <h2 class="text-xl font-semibold mb-4 mt-6">Recent Completed Jobs</h2>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
    {#each completedJobs as job}
      <div class="border border-gray-400 rounded-lg p-4 flex flex-col">
        <div class="flex justify-between font-bold mb-2">
          <span>{job.title}</span>
          <span>${job.reward_usd}</span>
        </div>
        <p class="text-sm text-gray-700 mb-2">{job.description}</p>
        <div class="flex justify-between items-center font-bold text-sm mt-auto">
            <!-- Display the child's name here -->
            <span class="text-gray-600">
            {#if job.child_id}
              {#await loadJSON('users.json') then users}
              {users.find(user => user.id === job.child_id)?.name ?? 'Unassigned'}
              {:catch error}
              No child assigned
              {/await}
            {:else}
              No child assigned
            {/if}
            </span>
          {#if job.status === 'pending'}
            <div>
              <button
                class="text-red-600 mr-2"
              >
                UNPAID
              </button>
            </div>
          {:else if job.status === 'paid'}
            <span class="text-blue-600">PAID</span>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>