import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userModel.js";
import ErrorHandler from "../utils/errorHandler.js";
import { instance } from '../server.js'
import crypto from 'crypto'
import { Payment } from "../models/paymentModel.js";

//Buy Subscription
export const createSubscription = catchAsyncError(async (req, resp, next) => {

    const user = await User.findById(req.user.id)
    if (user.role === 'admin') {
        return next(new ErrorHandler('admin not need to buy subscription', 404))
    }
    const plan_id = process.env.PLAN_ID || 'plan_LQXFefeirBDelD'
    const subscription = await instance.subscriptions.create({
        plan_id,
        customer_notify: 1,
        total_count: 12,
    })

    user.subscription = {
        id: subscription.id,
        status: subscription.status
    }

    await user.save()

    resp.status(201).json({
        success: true,
        subscriptionId: subscription.id
    })

})


//Payment Verify
export const paymentVerification = catchAsyncError(async (req, resp, next) => {
    const { razorpay_signature, razorpay_payment_id, razorpay_subscription_id } = req.body
    const user = await User.findById(req.user.id)
    const subscription_id = user.subscription.id;
    const generate_signature = crypto.createHmac("sha256", process.env.RAZORPAY_API_SECERT).update(razorpay_payment_id + "|" + subscription_id, "utf-8").digest("hex")

    const isAuth = generate_signature === razorpay_signature
    if (!isAuth) {
        resp.redirect(`${process.env.FRONTEND_URL}/paymentfail`)
    }
    await Payment.create({
        razorpay_signature,
        razorpay_payment_id,
        razorpay_subscription_id
    })

    user.subscription.status = 'active'
    await user.save()
    resp.redirect(`${process.env.FRONTEND_URL}/paymentsuccess?reference=${razorpay_payment_id}`)
})


//Get Razorpay ID
export const getRazorpayKey = catchAsyncError(async (req, resp, next) => {

    resp.status(200).json({
        success: true,
        key: process.env.RAZORPAY_API_KEY
    })

})


//Get Razorpay ID
export const cancelSubscription = catchAsyncError(async (req, resp, next) => {
    const user = await User.findById(req.user.id)

    const subscriptionId = user.subscription.id;

    let refund = false;
	

    await instance.subscriptions.cancel(subscriptionId);
    const payment = await Payment.findOne({
        razorpay_subscription_id: subscriptionId
    })
    const subscriptionGap = Date.now() - payment.createdAt

    const refundDays = process.env.REFUND_DAYS * 24 * 60 * 60 * 1000

    if (refundDays > subscriptionGap) {

        await instance.payments.refund(payment.razorpay_payment_id)
        refund = true
    }

    await payment.deleteOne()

    user.subscription.id = undefined
    user.subscription.status = undefined

    await user.save()

    resp.status(200).json({
        success: true,
        message: refund ? "Subscription cancelled, you will recived refund within 7 days " : "Subscription cancelled, No refund"
    })

})