import fs from 'fs/promises';
import path from 'path';

const JOBS_PATH = path.resolve('static/data/jobs.json');

// Helper function to read jobs.json
async function readJobs() {
  const data = await fs.readFile(JOBS_PATH, 'utf-8');
  return JSON.parse(data);
}

// Helper function to write to jobs.json
async function writeJobs(jobs: any[]) {
  await fs.writeFile(JOBS_PATH, JSON.stringify(jobs, null, 2));
}

// GET: Fetch all jobs
export const GET = async () => {
  try {
    const jobs = await readJobs();
    return new Response(JSON.stringify(jobs), { status: 200 });
  } catch (error) {
    return new Response('Failed to read jobs.json', { status: 500 });
  }
};

// POST: Add a new job
export const POST = async ({ request }: { request: Request }) => {
  try {
    const newJob = await request.json();
    const jobs = await readJobs();

    // Add a unique ID to the new job
    newJob.id = String(Date.now());
    jobs.push(newJob);

    await writeJobs(jobs);
    return new Response(JSON.stringify(newJob), { status: 201 });
  } catch (error) {
    return new Response('Failed to add job', { status: 500 });
  }
};

// DELETE: Remove a job by ID
export const DELETE = async ({ request }: { request: Request }) => {
  try {
    const { id } = await request.json();
    const jobs = await readJobs();

    const updatedJobs = jobs.filter((job: { id: string }) => job.id !== id);
    await writeJobs(updatedJobs);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response('Failed to delete job', { status: 500 });
  }
};

// PUT: Update a job by ID
export const PUT = async ({ request }: { request: Request }) => {
  try {
    const updatedJob = await request.json();
    const jobs = await readJobs();

    const index = jobs.findIndex((job: { id: string }) => job.id === updatedJob.id);
    if (index === -1) {
      return new Response('Job not found', { status: 404 });
    }

    jobs[index] = updatedJob;
    await writeJobs(jobs);

    return new Response(JSON.stringify(updatedJob), { status: 200 });
  } catch (error) {
    return new Response('Failed to update job', { status: 500 });
  }
};

