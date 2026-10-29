import { useEffect, useState } from 'react';
import client from '../api/client';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/format';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  // ----- details form -----
  const [name, setName] = useState(user.name);
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // ----- password form -----
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  // Local preview of the chosen image; revoke the object URL when it changes
  useEffect(() => {
    if (!avatarFile) return setPreview(null);
    const url = URL.createObjectURL(avatarFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const pickAvatar = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProfileMsg({ type: 'error', text: 'Profile picture must be 2 MB or smaller.' });
      return;
    }
    setAvatarFile(file);
    setRemoveAvatar(false);
    setProfileMsg({ type: '', text: '' });
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileMsg({ type: '', text: '' });
    setSavingProfile(true);
    try {
      const body = new FormData();
      body.append('name', name);
      if (avatarFile) body.append('avatar', avatarFile);
      if (removeAvatar) body.append('removeAvatar', 'true');
      const { data } = await client.patch('/auth/profile', body);
      updateUser(data.user);
      setAvatarFile(null);
      setRemoveAvatar(false);
      setProfileMsg({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message ?? 'Could not update your profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setPasswordMsg({ type: '', text: '' });
    if (passwords.newPassword !== passwords.confirm) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setSavingPassword(true);
    try {
      await client.patch('/auth/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
      setPasswordMsg({ type: 'success', text: 'Password changed.' });
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message ?? 'Could not change your password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const shownAvatar = removeAvatar ? null : preview ?? user.avatar?.url;
  const hasPicture = Boolean(user.avatar?.url) || Boolean(avatarFile);

  return (
    <section className="profile-page">
      <p className="eyebrow">Account</p>
      <h1>Your profile</h1>

      <div className="profile-layout">
        {/* ---------- details ---------- */}
        <form className="panel" onSubmit={saveProfile}>
          <p className="eyebrow">Personal details</p>
          <h2 className="panel-title">Profile</h2>

          <div className="avatar-row">
            {shownAvatar ? (
              <Avatar user={user} src={shownAvatar} size={88} />
            ) : (
              <Avatar user={{ name }} src={null} size={88} />
            )}
            <div>
              <label className="file-button">
                Change photo
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickAvatar} hidden />
              </label>
              {hasPicture && !removeAvatar && (
                <button
                  type="button"
                  className="text-action danger"
                  onClick={() => {
                    setAvatarFile(null);
                    setRemoveAvatar(true);
                  }}
                >
                  Remove
                </button>
              )}
              <p className="hint tiny">JPG, PNG or WebP, up to 2 MB.</p>
            </div>
          </div>

          <label>
            Full name
            <input required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Email <span className="hint">can't be changed</span>
            <input value={user.email} disabled />
          </label>

          <dl className="facts two">
            <div>
              <dt>Role</dt>
              <dd className="capitalize">{user.role}</dd>
            </div>
            <div>
              <dt>Member since</dt>
              <dd>{user.createdAt ? formatDate(user.createdAt) : '—'}</dd>
            </div>
          </dl>

          {profileMsg.text && <p className={profileMsg.type === 'error' ? 'error' : 'ok'}>{profileMsg.text}</p>}
          <button className="button full" type="submit" disabled={savingProfile}>
            {savingProfile ? 'Saving…' : 'Save profile'}
          </button>
        </form>

        {/* ---------- password ---------- */}
        <form className="panel" onSubmit={savePassword}>
          <p className="eyebrow">Security</p>
          <h2 className="panel-title">Change password</h2>
          <label>
            Current password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
            />
          </label>
          <label>
            New password <span className="hint">at least 8 characters</span>
            <input
              type="password"
              required
              minLength="8"
              autoComplete="new-password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              required
              minLength="8"
              autoComplete="new-password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            />
          </label>
          {passwordMsg.text && <p className={passwordMsg.type === 'error' ? 'error' : 'ok'}>{passwordMsg.text}</p>}
          <button className="button full" type="submit" disabled={savingPassword}>
            {savingPassword ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </section>
  );
}