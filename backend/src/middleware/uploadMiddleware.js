import multer from 'multer';
const storage = multer.memoryStorage();
const fileFilter = (req, file, callback) => callback(null, ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.mimetype));
export const uploadResume = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }).single('resume');

// Profile picture: images only, 2 MB. Unlike resumes, a bad file returns a clear 400.
const imageFilter = (req, file, callback) => {
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return callback(null, true);
  callback(new Error('Profile picture must be a JPG, PNG or WebP image'));
};
const avatarParser = multer({ storage, fileFilter: imageFilter, limits: { fileSize: 2 * 1024 * 1024 } }).single('avatar');
export const uploadAvatar = (req, res, next) =>
  avatarParser(req, res, (error) => {
    if (!error) return next();
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'Profile picture must be 2 MB or smaller' : error.message;
    res.status(400).json({ message });
  });