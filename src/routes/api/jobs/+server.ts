import { json, error } from '@sveltejs/kit';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

const JOBS_PATH = join(process.env.DATA_PATH || '/app/data', 'jobs.json');

// Helper function to read jobs.json
async function readJobs() {
  const data = await readFile(JOBS_PATH, 'utf-8');
  return JSON.parse(data);
}

// Helper function to write to jobs.json
async function writeJobs(jobs: any[]) {
  await writeFile(JOBS_PATH, JSON.stringify(jobs, null, 2));
}

// GET: Fetch all jobs
export const GET = async () => {
  try {
    const jobs = await readJobs();
    return json(jobs, { status: 200 });
  } catch (err) {
    throw error(500, 'Failed to read jobs.json');
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
    return json(newJob, { status: 201 });
  } catch (err) {
    throw error(500, 'Failed to add job');
  }
};

// DELETE: Remove a job by ID
export const DELETE = async ({ request }: { request: Request }) => {
  try {
    const { id } = await request.json();
    const jobs = await readJobs();

    const updatedJobs = jobs.filter((job: { id: string }) => job.id !== id);
    await writeJobs(updatedJobs);

    return json({ success: true }, { status: 200 });
  } catch (err) {
    throw error(500, 'Failed to delete job');
  }
};

// PUT: Update a job by ID
export const PUT = async ({ request }: { request: Request }) => {
  try {
    const updatedJob = await request.json();
    const jobs = await readJobs();

    const index = jobs.findIndex((job: { id: string }) => job.id === updatedJob.id);
    if (index === -1) {
      throw error(404, 'Job not found');
    }

    jobs[index] = updatedJob;
    await writeJobs(jobs);

    return json(updatedJob, { status: 200 });
  } catch (err) {
    throw error(500, 'Failed to update job');
  }
};