import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatSalary } from '../utils/format';

export default function JobDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [applied, setApplied] = useState(null); // existing application, if any
  const [coverLetter, setCoverLetter] = useState('');
  const [resume, setResume] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client
      .get(`/jobs/${id}`)
      .then(({ data }) => setJob(data.job))
      .catch(() => setNotFound(true));
  }, [id]);

  // Has this applicant already applied?
  useEffect(() => {
    if (user?.role !== 'applicant') return;
    client.get('/applications').then(({ data }) => {
      setApplied(data.applications.find((item) => item.job?._id === id) ?? null);
    });
  }, [id, user]);

  const apply = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const body = new FormData();
      body.append('jobId', id);
      body.append('coverLetter', coverLetter);
      if (resume) body.append('resume', resume);
      const { data } = await client.post('/applications', body);
      setApplied(data.application);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not submit your application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (notFound) {
    return (
      <section className="center">
        <h1>Job not found</h1>
        <Link className="button" to="/jobs">Back to jobs</Link>
      </section>
    );
  }
  if (!job) return <p className="center">Loading role…</p>;

  const isOpen = job.status === 'open';

  return (
    <section className="job-detail">
      <Link className="back-link" to="/jobs">← All jobs</Link>

      <div className="detail-layout">
        {/* ---------- full job information ---------- */}
        <article className="detail-main">
          <header className="detail-header">
            {job.companyLogo && (
              <img className="logo large" src={job.companyLogo} alt={`${job.companyName} logo`} onError={(e) => (e.currentTarget.style.display = 'none')} />
            )}
            <div>
              <p className="eyebrow">{job.companyName}</p>
              <h1>{job.title}</h1>
            </div>
          </header>

          <dl className="facts">
            <div><dt>Location</dt><dd>{job.location}</dd></div>
            <div><dt>Type</dt><dd>{job.employmentType}</dd></div>
            <div><dt>Salary</dt><dd>{formatSalary(job.salary)}</dd></div>
            <div><dt>Posted</dt><dd>{formatDate(job.createdAt)}</dd></div>
          </dl>

          {!!job.skills?.length && (
            <>
              <h2>Skills</h2>
              <div className="skill-list">
                {job.skills.map((skill) => (
                  <span className="pill" key={skill}>{skill}</span>
                ))}
              </div>
            </>
          )}

          <h2>About the role</h2>
          <p className="prose">{job.description}</p>

          {job.aboutCompany && (
            <>
              <h2>About {job.companyName}</h2>
              <p className="prose">{job.aboutCompany}</p>
            </>
          )}
        </article>

        {/* ---------- apply box ---------- */}
        <aside className="apply-box">
          <p className="eyebrow">Apply</p>
          <h2>Interested in this role?</h2>

          {!isOpen && <p className="muted">This position is closed and no longer accepting applications.</p>}

          {isOpen && !user && (
            <>
              <p className="muted">Sign in as an applicant to submit your application.</p>
              <Link className="button full" to="/login">Sign in to apply</Link>
              <p className="tiny">New here? <Link to="/register">Create an account</Link></p>
            </>
          )}

          {isOpen && user && user.role !== 'applicant' && (
            <p className="muted">You're signed in as a {user.role}. Only applicants can apply to jobs.</p>
          )}

          {isOpen && user?.role === 'applicant' && applied && (
            <div className="success">
              <b>Application submitted ✓</b>
              <p className="tiny">
                Sent on {formatDate(applied.createdAt)} · Status: <b>{applied.status}</b>
              </p>
              <Link to="/dashboard">Track it in your dashboard</Link>
            </div>
          )}

          {isOpen && user?.role === 'applicant' && !applied && (
            <form onSubmit={apply}>
              <label>
                Cover letter <span className="hint">optional</span>
                <textarea rows="6" maxLength="3000" value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
              </label>
              <label>
                Resume <span className="hint">PDF or Word, max 5 MB</span>
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResume(e.target.files[0] ?? null)} />
              </label>
              {error && <p className="error">{error}</p>}
              <button className="button full" type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Apply now'}
              </button>
            </form>
          )}
        </aside>
      </div>
    </section>
  );
}