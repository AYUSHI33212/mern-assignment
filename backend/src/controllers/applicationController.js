import mongoose from 'mongoose';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import uploadToCloudinary from '../utils/uploadToCloudinary.js';

const STATUSES = Application.schema.path('status').enumValues;

export async function createApplication(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.body.jobId)) {
      return res.status(404).json({ message: 'Open job not found' });
    }
    const job = await Job.findOne({ _id: req.body.jobId, status: 'open' });
    if (!job) return res.status(404).json({ message: 'Open job not found' });

    let resume;
    if (req.file) {
      const file = await uploadToCloudinary(req.file.buffer, 'job-portal/resumes', 'raw');
      resume = { url: file.secure_url, publicId: file.public_id };
    }

    const application = await Application.create({
      job: job._id,
      applicant: req.user._id,
      coverLetter: req.body.coverLetter,
      resume,
    });
    res.status(201).json({ application });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already applied to this job' });
    }
    next(error);
  }
}

// Applicant: their own applications. Recruiter: applications on their jobs. Admin: all.
export async function listApplications(req, res, next) {
  try {
    const query = req.user.role === 'applicant' ? { applicant: req.user._id } : {};
    const applications = await Application.find(query)
      .populate({
        path: 'job',
        match: req.user.role === 'recruiter' ? { recruiter: req.user._id } : {},
      })
      .populate('applicant', 'name email')
      .sort({ createdAt: -1 });
    res.json({ applications: applications.filter((item) => item.job) });
  } catch (error) {
    next(error);
  }
}

// Recruiter dashboard -> "Submissions" button: every applicant of ONE job
export async function listJobApplications(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.jobId)) {
      return res.status(404).json({ message: 'Job not found' });
    }
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (req.user.role !== 'admin' && !job.recruiter.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not your job post' });
    }
    const applications = await Application.find({ job: job._id })
      .populate('applicant', 'name email')
      .sort({ createdAt: -1 });
    res.json({ job, applications });
  } catch (error) {
    next(error);
  }
}

export async function updateApplicationStatus(req, res, next) {
  try {
    if (!STATUSES.includes(req.body.status)) {
      return res.status(400).json({ message: `Status must be one of: ${STATUSES.join(', ')}` });
    }
    const application = await Application.findById(req.params.id).populate('job');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (req.user.role !== 'admin' && !application.job.recruiter.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not permitted' });
    }
    application.status = req.body.status;
    await application.save();
    res.json({ application });
  } catch (error) {
    next(error);
  }
}