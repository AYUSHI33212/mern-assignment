import bcrypt from 'bcrypt';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import uploadToCloudinary from '../utils/uploadToCloudinary.js';
import { safeUser } from './authController.js';

// PATCH /api/auth/profile  (multipart/form-data: name, avatar?, removeAvatar?)
export async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id);

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ message: 'Name cannot be empty' });
      user.name = name;
    }

    const removeAvatar = req.body.removeAvatar === 'true';
    if (req.file || removeAvatar) {
      const oldPublicId = user.avatar?.publicId;
      if (req.file) {
        const image = await uploadToCloudinary(req.file.buffer, 'job-portal/avatars', 'image');
        user.avatar = { url: image.secure_url, publicId: image.public_id };
      } else {
        user.avatar = undefined;
      }
      // Clean up the previous picture; a failure here must not fail the request
      if (oldPublicId) cloudinary.uploader.destroy(oldPublicId).catch(() => {});
    }

    await user.save();
    res.json({ user: safeUser(user) });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/auth/password  ({ currentPassword, newPassword })
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchesPassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (error) {
    next(error);
  }
}