import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { formatDate } from '../utils/format';

export default function ApplicantDashboard() {
  const [applications, setApplications] = useState(null);

  useEffect(() => {
    client
      .get('/applications')
      .then(({ data }) => setApplications(data.applications))
      .catch(() => setApplications([]));
  }, []);

  return (
    <section className="panel">
      <p className="eyebrow">My applications</p>
      <h2 className="panel-title">Where you've applied</h2>

      {applications === null && <p className="muted">Loading…</p>}
      {applications?.length === 0 && (
        <p className="muted">
          You haven't applied to anything yet. <Link to="/jobs">Browse open roles</Link>
        </p>
      )}

      <div className="job-list">
        {applications?.map((application) => (
          <div className="job-row" key={application._id}>
            <div>
              <Link to={`/jobs/${application.job._id}`}>
                <strong>{application.job.title}</strong>
              </Link>
              <p className="muted tiny">
                {application.job.companyName} · {application.job.location} · Applied{' '}
                {formatDate(application.createdAt)}
              </p>
            </div>
            <span className={`status status-${application.status}`}>{application.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}