import { loadJSON } from '$lib/utils/jsonStorage';
import { writeFile } from 'fs/promises';
import { join } from 'path';

async function writeJobs(jobs: any[]) {
  const filePath = join('data', 'jobs.json');
  await writeFile(filePath, JSON.stringify(jobs, null, 2));
}

export async function GET() {
  try {
    const jobs = await loadJSON('jobs.json');
    return new Response(JSON.stringify(jobs), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('GET /api/jobs error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch jobs' }), { status: 500 });
  }
}

export async function POST({ request }) {
  try {
    const newJob = await request.json();
    const jobs = await loadJSON('jobs.json');
    // Always assign a string id
    newJob.id = jobs.length > 0 ? (Math.max(...jobs.map(job => Number(job.id) || 0)) + 1).toString() : Date.now().toString();
    jobs.push(newJob);
    await writeJobs(jobs);
    return new Response(JSON.stringify(newJob), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('POST /api/jobs error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create job' }), { status: 500 });
  }
}

export async function PUT({ request }) {
  try {
    const updatedJob = await request.json();
    const jobs = await loadJSON('jobs.json');
    const index = jobs.findIndex(job => String(job.id) === String(updatedJob.id));
    if (index === -1) {
      return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404 });
    }
    jobs[index] = updatedJob;
    await writeJobs(jobs);
    return new Response(JSON.stringify(updatedJob), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('PUT /api/jobs error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update job' }), { status: 500 });
  }
}

export async function DELETE({ request }) {
  try {
    const body = await request.json();
    let jobs = await loadJSON('jobs.json');

    // Bulk delete all paid jobs
    if (body.deleteAllPaid) {
      jobs = jobs.filter(job => job.status !== 'paid');
      await writeJobs(jobs);
      return new Response(JSON.stringify(jobs), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Single job delete
    const { id } = body;
    if (id === undefined) {
      return new Response(JSON.stringify({ error: 'Job id required' }), { status: 400 });
    }
    const updatedJobs = jobs.filter(job => String(job.id) !== String(id));
    await writeJobs(updatedJobs);
    return new Response(JSON.stringify(updatedJobs), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('DELETE /api/jobs error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete job' }), { status: 500 });
  }
}