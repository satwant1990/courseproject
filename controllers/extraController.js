import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Stats } from "../models/statModel.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendEmail } from "../utils/sendEmail.js";

export const contact = catchAsyncError(async (req, resp, next) => {

    const { name, email, message } = req.body

    if (!name || !email || !message) {
        return next(new ErrorHandler("Please provide all field", 400))
    }

    const to = process.env.ADMIN_MAIL
    const subject = 'Contact from Course Project'
    const text = `My Name is ${name} and my Email is ${email} and ${message}`
    await sendEmail(to, subject, text)

    resp.status(200).json({
        success: true,
        message: "Contact form submitted successfully"
    })
})

export const courseRequest = catchAsyncError(async (req, resp, next) => {

    const { name, email, course } = req.body
    if (!name || !email || !course) {
        return next(new ErrorHandler("Please provide all field", 400))
    }
    const to = process.env.ADMIN_MAIL
    const subject = `Course Request by ${name} `
    const text = `My Name is ${name} and my Email is ${email} and ${course}`
    await sendEmail(to, subject, text)

    resp.status(200).json({
        success: true,
        message: "Course request submitted successfully"
    })
})

export const dashboardStats = catchAsyncError(async (req, resp, next) => {

    const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(12)

    const statData = []

    for (let i = 0; i < stats.length; i++) {
        statData.unshift(stats[i])
    }

    const reqData = 12 - stats.length

    for (let d = 0; d < reqData; d++) {

        statData.unshift({
            users: 0,
            subscriptions: 0,
            views: 0
        })
    }

    const usersCount = statData[11].users
    const subscriptionsCount = statData[11].subscriptions
    const viewsCount = statData[11].views


    let usersProfit = true, subscriptionsProfit = true, viewsProfit = true


    let usersPercentage = 0, subscriptionsPercentage = 0, viewsPercentage = 0

    if (statData[10].users === 0) usersPercentage = usersCount * 100
    if (statData[10].subscriptions === 0) subscriptionsPercentage = subscriptionsCount * 100
    if (statData[10].views === 0) viewsPercentage = viewsCount * 100
    else {
        const differStats = {
            users: statData[11].users - statData[10].users,
            subscriptions: statData[11].subscriptions - statData[10].subscriptions,
            views: statData[11].views - statData[10].views,
        }
        usersPercentage = (differStats.users / statData[10].users) * 100
        subscriptionsPercentage = (differStats.subscriptions / statData[10].subscriptions) * 100
        viewsPercentage = (differStats.views / statData[10].views) * 100

        usersPercentage < 0 ? usersProfit = false : usersProfit = true
        subscriptionsPercentage < 0 ? subscriptionsProfit = false : subscriptionsProfit = true
        viewsPercentage < 0 ? viewsProfit = false : viewsProfit = true

    }

    resp.status(200).json({
        success: true,
        stats: statData,
        usersCount,
        subscriptionsCount,
        viewsCount,
        usersPercentage,
        subscriptionsPercentage,
        viewsPercentage,
        usersProfit,
        subscriptionsProfit,
        viewsProfit
    })
})