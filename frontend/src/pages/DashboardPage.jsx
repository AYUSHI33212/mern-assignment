import { useAuth } from "../context/AuthContext";
import ApplicantDashboard from "../components/ApplicantDashboard";
import RecruiterDashboard from "../components/RecruiterDashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  const message =
    user.role === "applicant"
      ? "Track applications and keep your profile ready for the next great role."
      : user.role === "recruiter"
        ? "Manage openings and meet the people behind the applications."
        : "Oversee portal activity and manage access across your organization.";

  return (
    <section className="dashboard">
      <p className="eyebrow">{user.role} workspace</p>
      <h1>Welcome back, {user.name.split(" ")[0]}.</h1>
      <p className="lead">{message}</p>

      {user.role === "recruiter" && <RecruiterDashboard />}
      {user.role === "applicant" && <ApplicantDashboard />}
      {user.role === "admin" && (
        <div className="role-cards">
          <article>
            <h2>Your job posts</h2>
            <p>Connect this card to the relevant API view next.</p>
          </article>
          <article>
            <h2>Profile</h2>
            <p>Keep your details current to get the most from CareerNest.</p>
          </article>
        </div>
      )}
    </section>
  );
}