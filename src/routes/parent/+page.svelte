<script lang="ts">
  import { onMount } from 'svelte';
  import { jobs } from '$lib/stores/jobs';
  import { currentUser } from '$lib/stores/currentUser';
  import { get } from 'svelte/store';
  import { writable } from 'svelte/store';

  const user = writable(null);

  export let data: { jobs: any[]; users: any[] }; // Data from +page.server.ts

  let availableJobs = [];
  let completedJobs = [];
  let showCreateForm = false;
  let newJob: { 
    title: string; 
    description: string; 
    reward_usd: number; 
    status: string; 
    child_id: string; 
    parent_id: string 
  } = {
    title: '',
    description: '',
    reward_usd: 0, // Changed to number
    status: '',
    child_id: '',
    parent_id: ''
  };

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
  });

function updateJobs(jobData: any[]) {
  jobs.set(jobData);
  availableJobs = jobData.filter(j => j.status === 'open');
  completedJobs = jobData.filter(j => j.status === 'inreview' || j.status === 'paid');
}

  onMount(() => {
    updateJobs(data.jobs);
  });

  async function deleteJob(id: string) {
    availableJobs = availableJobs.filter(j => j.id !== id);
    await fetch('/api/jobs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const updatedJobs = await (await fetch('/api/jobs')).json();
    updateJobs(updatedJobs);
  }

  async function rejectJob(id: string) {
    const job = completedJobs.find(j => j.id === id);
    if (job) {
      job.status = 'open';
      availableJobs = [...availableJobs, job];
      completedJobs = completedJobs.filter(j => j.id !== id);
      await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...job, status: 'open' })
      });
      const updatedJobs = await (await fetch('/api/jobs')).json();
      updateJobs(updatedJobs);
    }
  }

  async function markAsPaid(id: string) {
    const job = completedJobs.find(j => j.id === id);
    if (job) {
      job.status = 'paid';
      await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...job, status: 'paid' })
      });
      const updatedJobs = await (await fetch('/api/jobs')).json();
      updateJobs(updatedJobs);
    }
  }

 async function createJob() {
  newJob.status = 'open';
  newJob.child_id = '';
  const user = get(currentUser);
  newJob.parent_id = user?.id || '';
  // Always assign a string id
  newJob.id = Date.now().toString();
  const response = await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newJob)
  });
  if (!response.ok) {
    console.error('Failed to create job:', await response.text());
    return;
  }
  newJob = {
    title: '',
    description: '',
    reward_usd: 0,
    status: '',
    child_id: '',
    parent_id: user?.id || ''
  };
  showCreateForm = false;
  const updatedJobs = await (await fetch('/api/jobs')).json();
  updateJobs(updatedJobs);
}
async function deleteAllPaidJobs() {
  await fetch('/api/jobs', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deleteAllPaid: true })
  });
  const updatedJobs = await (await fetch('/api/jobs')).json();
  updateJobs(updatedJobs);
}
</script>

<div class="px-4 py-8 max-w-4xl mx-auto font-sans">
  <div class="flex justify-between items-center mb-8">
    <h1 class="text-2xl font-bold">Manage Family Jobs</h1>
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
    <h1 class="text-xl font-bold mb-4 mt-6 text-center text-blue-600">Available Jobs</h1>
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
            {#if job.status === 'open'}
              <div>
                <button
                  class="text-red-600 font-semibold mt-auto self-end hover:underline"
                  on:click={() => deleteJob(job.id)}
                  on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') deleteJob(job.id); }}
                >
                  DELETE
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/each}
      <button
        class="border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center font-bold text-gray-500 bg-gray-100 cursor-pointer hover:bg-gray-200 transition"
        on:click={() => showCreateForm = true}
        on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') showCreateForm = true; }}
      >
        + Create Job
      </button>
      {#if showCreateForm}
        <div class="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              class="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              on:click={() => showCreateForm = false}
              on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') showCreateForm = false; }}
            >
              ×
            </button>
            <h2 class="text-xl font-bold mb-4 text-center">Create Job</h2>
            <form on:submit|preventDefault={createJob}>
              <div class="mb-4">
                <label for="job-name" class="block text-sm font-medium mb-1">Job Name</label>
                <input
                  id="job-name"
                  type="text"
                  bind:value={newJob.title}
                  placeholder="ex. Mow Lawn"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div class="mb-4">
                <label for="job-details" class="block text-sm font-medium mb-1">Details</label>
                <textarea
                  id="job-details"
                  bind:value={newJob.description}
                  placeholder="ex. Front and back yards. Include trimming and edging."
                  class="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows="3"
                  required
                ></textarea>
              </div>
              <div class="mb-4">
                <label for="job-reward" class="block text-sm font-medium mb-1">Reward</label>
                <input
                  id="job-reward"
                  type="number"
                  bind:value={newJob.reward_usd}
                  placeholder="ex. 20"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <button
                type="submit"
                class="w-full bg-blue-500 text-white font-bold py-2 rounded-lg hover:bg-blue-600 transition"
              >
                SUBMIT
              </button>
            </form>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div>
    <h1 class="text-xl font-bold mb-4 mt-6 text-center text-blue-600">Recently Completed Jobs</h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {#each completedJobs.filter(job => job.status === 'inreview') as job}
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
                on:click={() => rejectJob(job.id)}
                on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') rejectJob(job.id); }}
              >
                REJECT
              </button>
              <button
                class="text-green-600 hover:underline"
                on:click={() => markAsPaid(job.id)}
                on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') markAsPaid(job.id); }}
              >
                PAY
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div>
    <h1 class="text-xl font-bold mb-4 mt-6 text-center text-blue-600">Paid Jobs</h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {#each completedJobs.filter(job => job.status === 'paid') as job}
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
            <span class="text-blue-600">PAID</span>
          </div>
        </div>
      {/each}
    </div>
  </div>
  <button
    class="fixed bottom-6 right-6 z-50 bg-red-100 text-white border border-red-200 rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-200 transition"
    aria-label="Purge All Paid Jobs"
    title="Purge All Paid Jobs"
    on:click={deleteAllPaidJobs}
    on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') deleteAllPaidJobs(); }}
  >
  </button>

</div>