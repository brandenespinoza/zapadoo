<script lang="ts">
  import { onMount } from 'svelte';
  import { jobs } from '$lib/stores/jobs';
  import { currentUser } from '$lib/stores/currentUser';
  import { loadJSON } from '$lib/utils/jsonStorage';
  import { get } from 'svelte/store';
  import { writable } from 'svelte/store';

const user = writable(null);

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
    reward_usd: '',
    status: '',
    child_id: '',
    parent_id: ''
  };

  async function fetchJobs() {
    const jobData = await loadJSON('jobs.json');
    jobs.set(jobData);
    availableJobs = jobData.filter(j => j.status === 'open');
    completedJobs = jobData.filter(j => j.status === 'pending' || j.status === 'paid');
  }

  onMount(fetchJobs);

  async function deleteJob(id: string) {
    // Remove from UI immediately
    availableJobs = availableJobs.filter(j => j.id !== id);

    // Call backend endpoint to update jobs.json
    await fetch('/api/jobs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    // Refresh jobs from backend
    await fetchJobs();
  }

  async function rejectJob(id: string) {
  // Find the job and update its status locally
  const job = completedJobs.find(j => j.id === id);
  if (job) {
    job.status = 'open';
    availableJobs = [...availableJobs, job];
    completedJobs = completedJobs.filter(j => j.id !== id);
  }

  // Call the backend API to update the job's status
  await fetch('/api/jobs', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...job, status: 'open' })
  });

  // Refresh jobs from the backend
  await fetchJobs();
}
  async function markAsPaid(id: string) {
  // Find the job and update its status locally
  const job = completedJobs.find(j => j.id === id);
  if (job) {
    job.status = 'paid';
  }

  // Call the backend API to update the job's status
  await fetch('/api/jobs', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...job, status: 'paid' })
  });

  // Refresh jobs from the backend
  await fetchJobs();
}

// PUT: Update a job by ID
export const PUT = async ({ request }: { request: Request }) => {
  try {
    const updatedJob = await request.json();
    const jobs = await readJobs();

    const index = jobs.findIndex((job: { id: string }) => job.id === updatedJob.id);
    if (index === -1) {
      return new Response('Job not found', { status: 404 });
    }

    // Update the job in the array
    jobs[index] = updatedJob;
    await writeJobs(jobs);

    return new Response(JSON.stringify(updatedJob), { status: 200 });
  } catch (error) {
    return new Response('Failed to update job', { status: 500 });
  }
};


// CREATE: Create a new job
 async function createJob() {
    newJob.status = 'open';
    newJob.child_id = '';
    const user = get(currentUser);
    newJob.parent_id = user?.id || '';    

    console.log('Submitting job:', newJob);

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

    await fetchJobs();
  }




</script>
<div class="px-4 py-8 max-w-4xl mx-auto font-sans">
  <div class="flex justify-between items-center mb-8">
    <h1 class="text-2xl font-bold">Manage Family Jobs</h1>
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
            <div class="flex justify-between items-center font-bold text-sm mt-auto">
              <!-- Display the child's name here -->
              <span class="text-gray-600">
              {#if job.parent_id}
                {#await loadJSON('users.json') then users}
                {users.find(user => user.id === job.parent_id)?.name ?? 'Unassigned'}
                {:catch error}
                Unassigned
                {/await}
              {:else}
                Unassigned
              {/if}
              </span>
            {#if job.status === 'open'}
              <div>
                <button
                class="text-red-600 font-semibold mt-auto self-end hover:underline"
                on:click={() => deleteJob(job.id)}
              >
                DELETE
              </button>
              </div>
            {/if}
          </div>
        </div>
      {/each}
      <div class="border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center font-bold text-gray-500 bg-gray-100 cursor-pointer hover:bg-gray-200 transition"
      on:click={() => showCreateForm = true}>
      + Create Job
      </div>
      {#if showCreateForm}
        <div class="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              class="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              on:click={() => showCreateForm = false}
            >
              &times;
            </button>
            <h2 class="text-xl font-bold mb-4 text-center">Create Job</h2>
            <form on:submit|preventDefault={createJob}>
              <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Job Name</label>
                <input
                  type="text"
                  bind:value={newJob.title}
                  placeholder="ex. Mow Lawn"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Details</label>
                <textarea
                  bind:value={newJob.description}
                  placeholder="ex. Front and back yards. Include trimming and edging."
                  class="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows="3"
                  required
                ></textarea>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Reward</label>
                <input
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
                class="text-red-600 hover:underline mr-2"
                on:click={() => rejectJob(job.id)}
              >
                REJECT
              </button>
              <button
                class="text-green-600 hover:underline"
                on:click={() => markAsPaid(job.id)}
              >
                PAY
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
</div>