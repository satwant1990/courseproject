import { catchAsyncError } from "../middlewares/catchAsyncError.js"
import { User } from "../models/userModel.js"
import { sendEmail } from "../utils/sendEmail.js"
import ErrorHandler from "../utils/errorHandler.js"
import { sendToken } from "../utils/sendToken.js"
import crypto from 'crypto'
import { Course } from "../models/courseModal.js"
import cloudinary from 'cloudinary'
import getDataUri from "../utils/dataUri.js";
import { Stats } from '../models/statModel.js'

//Get all user by admin
export const getAllusers = catchAsyncError(async (req, resp, next) => {

    const user = await User.find()

    resp.status(200).json({
        success: true,
        user
    })
})

//Update user role by admin
export const updateUserRoleByAdmin = catchAsyncError(async (req, resp, next) => {

    const { id } = req.params
    const { role } = req.body
    let user = await User.findById(id)
    if (!user) {
        return next(new ErrorHandler('user not found', 400))
    }
    user.role = role
    await user.save()


    resp.status(200).json({
        success: true,
        message: "User role updated successfully",
        user
    })
})

//User Register
export const register = catchAsyncError(async (req, resp, next) => {
    const { name, email, password } = req.body


    if (!name || !email || !password) {
        return next(new ErrorHandler('All Fields Required', 400))
    }

    let user = await User.findOne({ email })

    if (user) {
        return next(new ErrorHandler('user already exists', 409))
    }

    // Upload file
    const file = req.file;
    const fileUri = getDataUri(file)
    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content)

    user = await User.create({
        name, email, password,
        avatar: {
            publicId: myCloud.public_id,
            publicUrl: myCloud.secure_url
        }
    })

    sendToken(resp, user, 'User Register succesfull', 201)

})

//Login User
export const loginUser = catchAsyncError(async (req, resp, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ErrorHandler('All Fields Required', 400))
    }

    const user = await User.findOne({ email }).select("+password")

    if (!user) {
        return next(new ErrorHandler('user not found', 400))
    }
    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
        return next(new ErrorHandler('email or password is incorrect', 400))
    }

    sendToken(resp, user, 'User login succesfull', 200)

})

//Logout user
export const logout = catchAsyncError(async (req, resp, next) => {
    const options = {
        expires: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: true,
        sameSite: "none"
    }
    resp.status(200).cookie('token', null, options).json({
        success: true,
        message: "User logout successfully"
    })

})


//Get Logged user profile
export const getMyProfile = catchAsyncError(async (req, resp, next) => {


    const user = await User.findById(req.user.id)
    resp.status(200).json({
        success: true,
        user
    })


})

//Change logged user password
export const changePassword = catchAsyncError(async (req, resp, next) => {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) {
        return next(new ErrorHandler('All Fields Required', 400))
    }

    let user = await User.findById(req.user.id).select("+password")
    const isMatch = await user.comparePassword(oldPassword)
    if (!isMatch) {
        return next(new ErrorHandler('Old Password is incorrect', 400))
    }

    user.password = newPassword;
    await user.save()

    resp.status(201).json({
        success: true,
        message: "Password changed successfully"
    })

})

//UPdate logged user profile
export const profileUpdate = catchAsyncError(async (req, resp, next) => {
    const { name, email } = req.body
    const user = await User.findById(req.user.id)

    if (name) user.name = name;
    if (email) user.email = email;
    await user.save()

    resp.status(201).json({
        success: true,
        message: "Profile updated successfully"
    })

})

//UPdate logged user profile photo
export const profilePhotoUpdate = catchAsyncError(async (req, resp, next) => {

    let user = await User.findById(req.user.id)
    const file = req.file;
    const fileUri = getDataUri(file)
    await cloudinary.v2.uploader.destroy(user.avatar.publicId)


    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content)

    user.avatar = {
        publicId: myCloud.public_id,
        publicUrl: myCloud.secure_url
    }

    await user.save()


    resp.status(201).json({
        success: true,
        message: "Profile picture updated successfully"
    })

})

//Forget password
export const forgetPassword = catchAsyncError(async (req, resp, next) => {

    const { email } = req.body
    if (!email) {
        return next(new ErrorHandler('All Fields Required', 400))
    }

    const user = await User.findOne({ email })
    if (!user) {
        return next(new ErrorHandler('User not found', 400))
    }

    const resetToken = await user.getResetToken();

    await user.save()
    const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`
    const message = `Click link to reset password ${url}. please ignore if you not requeste`

    sendEmail(email, 'Reset Password', message)

    resp.status(201).json({
        success: true,
        message: `Reset tokan send to ${user.email} successfully`
    })

})

//Reset passsword send mail
export const ressetPassword = catchAsyncError(async (req, resp, next) => {
    const { token } = req.params;

    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {
            $gt: Date.now()
        }
    })
    if (!user) {
        return next(new ErrorHandler('Token is invalid or expired', 401))
    }

    const { password } = req.body
    if (!password) {
        return next(new ErrorHandler('Please enter new password', 401))
    }

    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save()
    resp.status(201).json({
        success: true,
        message: "password updated successfully",
    })

})


//Add to playlist
export const addToPlaylist = catchAsyncError(async (req, resp, next) => {
    const user = await User.findById(req.user.id)
    const { id } = req.body;
    if (!id) {
        return next(new ErrorHandler('All fields required', 401))
    }

    const course = await Course.findById(id)

    if (!course) {
        return next(new ErrorHandler('Course not found', 404))
    }

    const itemExists = user.playlist.find((item) => {
        if (item.course.toString() === course._id.toString()) {
            return true
        }
    })
    if (itemExists) {
        return next(new ErrorHandler('Course already exists', 409))
    }

    user.playlist.push({
        course: course._id,
        poster: course.poster.publicUrl
    })

    await user.save()

    resp.status(200).json({
        success: true,
        message: "Course added to playlist successfully"
    })
})

//Remove from playlist
export const removeFromPlaylist = catchAsyncError(async (req, resp, next) => {
    const user = await User.findById(req.user.id)
    const { id } = req.query;
    if (!id) {
        return next(new ErrorHandler('All fields required', 401))
    }

    const course = await Course.findById(id)

    if (!course) {
        return next(new ErrorHandler('Course not found', 404))
    }

    const newPlaylist = user.playlist.filter((item) => {
        if (item.course.toString() !== course._id.toString()) {
            return item;
        }
    })

    user.playlist = newPlaylist;

    await user.save()

    resp.status(200).json({
        success: true,
        message: "Course removed from playlist successfully"
    })
})

// Delete user by admin
export const deleteUserByAdmin = catchAsyncError(async (req, resp, next) => {
    const { id } = req.params;
    const user = await User.findById(id)
    if (!user) {
        return next(new ErrorHandler('User not found', 404))
    }
    await cloudinary.v2.uploader.destroy(user.avatar.publicId)

    //cancel subscription

    await user.deleteOne()



    resp.status(200).json({
        success: true,
        message: "User Deleted Successfully"
    })

})


//Delete my profile
export const deleteMyProfile = catchAsyncError(async (req, resp, next) => {
    console.log('rers')
    const user = await User.findById(req.user.id)

    console.log(user)

    await cloudinary.v2.uploader.destroy(user.avatar.publicId)

    //cancel subscription

    await user.deleteOne()
    const options = {
        expires: new Date(Date.now()),
        httpOnly: true,
        secure: true,
        sameSite: "none"
    }


    resp.status(200).cookie('token', null, options).json({
        success: true,
        message: "User Deleted Successfully"
    })

})


User.watch().on("change", async () => {
    const stats = await Stats.find({}).sort({ createdAt: "Desc" }).limit(1)
    const subscription = await User.find({ "subscription.status": "active" })
    stats[0].users = await User.countDocuments()
    stats[0].subscriptions = subscription.length
    stats[0].createdAt = new Date(Date.now())
    await stats[0].save()
})