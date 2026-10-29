import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  return (
    <>
      <header>
        <Link className="brand" to="/">CareerNest</Link>
        <nav>
          <NavLink to="/jobs">Find jobs</NavLink>
          {user ? (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/profile" className="nav-profile">
                <Avatar user={user} size={28} />
                Profile
              </NavLink>
              <button className="link-button" onClick={logout}>Sign out</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Sign in</NavLink>
              <Link className="button small" to="/register">Get started</Link>
            </>
          )}
        </nav>
      </header>
      <main>{children}</main>
    </>
  );
}