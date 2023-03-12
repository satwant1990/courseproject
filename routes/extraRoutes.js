import express from 'express'
import { contact, courseRequest, dashboardStats } from '../controllers/extraController.js';
import { isAuthenticated, isAuthorized } from '../middlewares/auth.js';
const router = express.Router()

router.route('/contact').post(contact)
router.route('/courserequest').post(courseRequest)

router.route('/admin/stats').get(isAuthenticated, isAuthorized, dashboardStats)

export default router;