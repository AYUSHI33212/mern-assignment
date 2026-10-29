import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { formatSalary } from '../utils/format';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({ keyword: '', location: '', employmentType: '' });

  const load = async () => {
    const { data } = await client.get('/jobs', { params: filters });
    setJobs(data.jobs);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section>
      <div className="page-heading">
        <p className="eyebrow">Open roles</p>
        <h1>Find your next opportunity</h1>
      </div>

      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <input
          placeholder="Title, skill, or company"
          onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
        />
        <input
          placeholder="Location"
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
        />
        <select onChange={(e) => setFilters({ ...filters, employmentType: e.target.value })}>
          <option value="">Any type</option>
          <option>Full-time</option>
          <option>Part-time</option>
          <option>Contract</option>
          <option>Internship</option>
        </select>
        <button className="button">Search</button>
      </form>

      <div className="job-grid">
        {jobs.map((job) => (
          <Link className="job-card-link" to={`/jobs/${job._id}`} key={job._id}>
            <article className="job-card">
              <div className="job-card-head">
                {job.companyLogo && (
                  <img className="logo" src={job.companyLogo} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
                )}
                <p className="pill">{job.employmentType}</p>
              </div>
              <h2>{job.title}</h2>
              <p>
                {job.companyName} · {job.location}
              </p>
              <p className="muted clamp">{job.description}</p>
              <p className="tiny salary">{formatSalary(job.salary)}</p>
              <span className="card-cta">View details &amp; apply →</span>
            </article>
          </Link>
        ))}
        {!jobs.length && <p>No roles match those filters yet.</p>}
      </div>
    </section>
  );
}