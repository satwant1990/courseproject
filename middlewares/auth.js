import ErrorHandler from "../utils/errorHandler.js";
import { catchAsyncError } from "./catchAsyncError.js";
import Jwt from 'jsonwebtoken'
import { User } from "../models/userModel.js";


export const isAuthenticated = catchAsyncError(async (req, resp, next) => {
    const { token } = req.cookies;

    if (!token) {
        return next(new ErrorHandler('PLease login first'))
    }
    const decoded = Jwt.verify(token, process.env.JWT_TOKEN)
    req.user = await User.findById(decoded.id)
    next()
})

export const isAuthorized = (req, resp, next) => {
    if (req.user.role !== 'admin') {
        return next(new ErrorHandler('You dont have access to this route', 400))
    }
    next()
}

export const isSubscriber = (req, resp, next) => {
    if (req.user.subscription.status !== 'active' && req.user.role !== 'admin') {
        return next(new ErrorHandler('Only subscriber can access thuus route', 403))
    }
    next()
}