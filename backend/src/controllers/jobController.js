import mongoose from 'mongoose';
import Job from '../models/Job.js';

// Only these fields can be set from the request body (prevents changing `recruiter`, etc.)
const EDITABLE_FIELDS = [
  'title',
  'companyName',
  'companyLogo',
  'aboutCompany',
  'description',
  'location',
  'employmentType',
  'skills',
  'salary',
  'status',
];

function pickJobFields(body) {
  const data = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  // Accept "React, CSS" as well as ["React", "CSS"]
  if (typeof data.skills === 'string') {
    data.skills = data.skills.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return data;
}

const canManage = (user, job) => user.role === 'admin' || job.recruiter.equals(user._id);

export async function listJobs(req, res, next) {
  try {
    const { keyword, location, employmentType } = req.query;
    const query = { status: 'open' };
    if (keyword) {
      query.$or = ['title', 'companyName', 'description', 'skills'].map((field) => ({
        [field]: { $regex: keyword, $options: 'i' },
      }));
    }
    if (location) query.location = { $regex: location, $options: 'i' };
    if (employmentType) query.employmentType = employmentType;
    const jobs = await Job.find(query).sort({ createdAt: -1 }).populate('recruiter', 'name');
    res.json({ jobs });
  } catch (error) {
    next(error);
  }
}

// Recruiter dashboard: jobs posted by the logged-in recruiter (admin sees all)
export async function listMyJobs(req, res, next) {
  try {
    const query = req.user.role === 'admin' ? {} : { recruiter: req.user._id };
    const jobs = await Job.find(query).sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (error) {
    next(error);
  }
}

// Public: full details of one job (used by the applicant "job detail" page)
export async function getJob(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Job not found' });
    }
    const job = await Job.findById(req.params.id).populate('recruiter', 'name');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ job });
  } catch (error) {
    next(error);
  }
}

export async function createJob(req, res, next) {
  try {
    const job = await Job.create({ ...pickJobFields(req.body), recruiter: req.user._id });
    res.status(201).json({ job });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

export async function updateJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (!canManage(req.user, job)) return res.status(403).json({ message: 'Not your job post' });
    Object.assign(job, pickJobFields(req.body));
    await job.save();
    res.json({ job });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

export async function deleteJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (!canManage(req.user, job)) return res.status(403).json({ message: 'Not your job post' });
    await job.deleteOne();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}