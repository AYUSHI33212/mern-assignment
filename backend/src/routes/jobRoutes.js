import { Router } from 'express';
import {
  createJob,
  deleteJob,
  getJob,
  listJobs,
  listMyJobs,
  updateJob,
} from '../controllers/jobController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', listJobs);
// NOTE: '/mine' must be declared before '/:id' or "mine" would be treated as an id
router.get('/mine', protect, authorize('recruiter', 'admin'), listMyJobs);
router.get('/:id', getJob);
router.post('/', protect, authorize('recruiter', 'admin'), createJob);
router.patch('/:id', protect, authorize('recruiter', 'admin'), updateJob);
router.delete('/:id', protect, authorize('recruiter', 'admin'), deleteJob);

export default router;