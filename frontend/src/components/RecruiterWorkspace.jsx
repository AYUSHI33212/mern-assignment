import { useEffect, useState } from 'react';
import client from '../api/client';

const EMPTY_FORM = {
  title: '',
  companyName: '',
  companyLogo: '',
  aboutCompany: '',
  location: '',
  employmentType: 'Full-time',
  skills: '',
  salaryMin: '',
  salaryMax: '',
  description: '',
};

const STATUSES = ['submitted', 'reviewing', 'shortlisted', 'rejected', 'hired'];

// job (from API) -> form values
const jobToForm = (job) => ({
  title: job.title ?? '',
  companyName: job.companyName ?? '',
  companyLogo: job.companyLogo ?? '',
  aboutCompany: job.aboutCompany ?? '',
  location: job.location ?? '',
  employmentType: job.employmentType ?? 'Full-time',
  skills: (job.skills ?? []).join(', '),
  salaryMin: job.salary?.min ?? '',
  salaryMax: job.salary?.max ?? '',
  description: job.description ?? '',
});

// form values -> API payload
const formToPayload = (form) => ({
  title: form.title,
  companyName: form.companyName,
  companyLogo: form.companyLogo,
  aboutCompany: form.aboutCompany,
  location: form.location,
  employmentType: form.employmentType,
  skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
  salary: {
    min: form.salaryMin === '' ? undefined : Number(form.salaryMin),
    max: form.salaryMax === '' ? undefined : Number(form.salaryMax),
  },
  description: form.description,
});

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null); // job whose submissions are open
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadJobs = async () => {
    const { data } = await client.get('/jobs/mine');
    setJobs(data.jobs);
  };

  useEffect(() => {
    loadJobs().catch(() => setError('Could not load your job posts.'));
  }, []);

  const setField = (name) => (event) => setForm({ ...form, [name]: event.target.value });

  const startEdit = (job) => {
    setEditingId(job._id);
    setForm(jobToForm(job));
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingId) await client.patch(`/jobs/${editingId}`, formToPayload(form));
      else await client.post('/jobs', formToPayload(form));
      cancelEdit();
      await loadJobs();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not save the job.');
    } finally {
      setSaving(false);
    }
  };

  const openSubmissions = async (job) => {
    setSelectedJob(job);
    setApplications([]);
    setLoadingApps(true);
    try {
      const { data } = await client.get(`/applications/job/${job._id}`);
      setApplications(data.applications);
    } catch {
      setError('Could not load submissions.');
    } finally {
      setLoadingApps(false);
    }
  };

  const changeStatus = async (application, status) => {
    try {
      await client.patch(`/applications/${application._id}/status`, { status });
      setApplications((list) =>
        list.map((item) => (item._id === application._id ? { ...item, status } : item)),
      );
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not update status.');
    }
  };

  const removeJob = async (job) => {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    try {
      await client.delete(`/jobs/${job._id}`);
      if (editingId === job._id) cancelEdit();
      if (selectedJob?._id === job._id) setSelectedJob(null);
      await loadJobs();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not delete the job.');
    }
  };

  return (
    <div className="recruiter-layout">
      {/* ---------- LEFT: post / edit form ---------- */}
      <section className="panel">
        <div className="panel-top">
          <p className="eyebrow">Job management</p>
          {editingId && (
            <button type="button" className="text-action" onClick={cancelEdit}>
              Cancel edit
            </button>
          )}
        </div>
        <h2 className="panel-title">{editingId ? 'Edit job post' : 'Post a new role'}</h2>

        <form onSubmit={submit}>
          <div className="two-col">
            <label>
              Job title
              <input required value={form.title} onChange={setField('title')} />
            </label>
            <label>
              Company name
              <input required value={form.companyName} onChange={setField('companyName')} />
            </label>
          </div>

          <label>
            Company logo URL <span className="hint">optional</span>
            <input type="url" value={form.companyLogo} onChange={setField('companyLogo')} />
          </label>

          <label>
            About the company <span className="hint">shown on job detail page</span>
            <textarea rows="4" value={form.aboutCompany} onChange={setField('aboutCompany')} />
          </label>

          <div className="two-col">
            <label>
              Location
              <input required value={form.location} onChange={setField('location')} />
            </label>
            <label>
              Employment type
              <select value={form.employmentType} onChange={setField('employmentType')}>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
            </label>
          </div>

          <label>
            Skills <span className="hint">comma-separated</span>
            <input value={form.skills} onChange={setField('skills')} />
          </label>

          <div className="two-col">
            <label>
              Minimum salary
              <input type="number" min="0" value={form.salaryMin} onChange={setField('salaryMin')} />
            </label>
            <label>
              Maximum salary
              <input type="number" min="0" value={form.salaryMax} onChange={setField('salaryMax')} />
            </label>
          </div>

          <label>
            Role description
            <textarea required rows="5" value={form.description} onChange={setField('description')} />
          </label>

          {error && <p className="error">{error}</p>}
          <button className="button full" type="submit" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish job'}
          </button>
        </form>
      </section>

      {/* ---------- RIGHT: jobs list + submissions ---------- */}
      <section className="panel">
        <p className="eyebrow">Applications</p>
        <h2 className="panel-title">Job submissions</h2>
        <p className="lead small">
          {selectedJob ? (
            <>
              Applicants for <b>{selectedJob.title}</b>
            </>
          ) : (
            'Choose a role to see its applicants.'
          )}
        </p>

        <div className="job-list">
          {jobs.map((job) => (
            <div key={job._id} className={`job-row ${selectedJob?._id === job._id ? 'active' : ''}`}>
              <div>
                <strong>{job.title}</strong>
                <p className="muted tiny">
                  {job.companyName} · {job.location}
                </p>
              </div>
              <div className="row-actions">
                <button type="button" className="text-action" onClick={() => startEdit(job)}>
                  Edit
                </button>
                <button type="button" className="text-action" onClick={() => openSubmissions(job)}>
                  Submissions
                </button>
                <button type="button" className="text-action danger" onClick={() => removeJob(job)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!jobs.length && <p className="muted">You haven't posted any roles yet.</p>}
        </div>

        {selectedJob && (
          <div className="submissions">
            <h3>
              {loadingApps ? 'Loading…' : `${applications.length} applicant${applications.length === 1 ? '' : 's'}`}
            </h3>
            {applications.map((application) => (
              <article key={application._id} className="applicant-card">
                <div className="applicant-head">
                  <div>
                    <strong>{application.applicant?.name}</strong>
                    <p className="muted tiny">{application.applicant?.email}</p>
                  </div>
                  <select
                    value={application.status}
                    onChange={(e) => changeStatus(application, e.target.value)}
                    aria-label="Application status"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                {application.coverLetter && <p className="cover">{application.coverLetter}</p>}
                <p className="tiny">
                  Applied {new Date(application.createdAt).toLocaleDateString()}
                  {application.resume?.url && (
                    <>
                      {' · '}
                      <a href={application.resume.url} target="_blank" rel="noreferrer">
                        View resume
                      </a>
                    </>
                  )}
                </p>
              </article>
            ))}
            {!loadingApps && !applications.length && (
              <p className="muted">No one has applied to this role yet.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}