import express from 'express'
import { cancelSubscription, createSubscription, getRazorpayKey, paymentVerification } from '../controllers/paymentController.js';
import { isAuthenticated } from '../middlewares/auth.js';
const router = express.Router()

//Buy subscription
router.route('/subscribe').get(isAuthenticated, createSubscription)

router.route('/paymentverification').post(isAuthenticated, paymentVerification)
router.route('/razorpaykey').get(isAuthenticated, getRazorpayKey)

//Cancel Subscription
router.route('/subscribe/cancel').delete(isAuthenticated, cancelSubscription)


export default router;