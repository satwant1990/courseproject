import mongoose from "mongoose";
import validator from 'validator'
import bcrypt from 'bcrypt'
import Jwt from "jsonwebtoken";
import crypto from 'crypto'

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter name']
    },
    email: {
        type: String,
        required: [true, 'Please enter email'],
        unique: [true, 'Email already exists'],
        validate: validator.isEmail
    },
    password: {
        type: String,
        required: [true, 'Please enter password'],
        minLength: [8, 'Password must be 8 chracters'],
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    subscription: {
        id: String,
        status: String
    },
    avatar: {
        publicId: {
            type: String,
            required: true
        },
        publicUrl: {
            type: String,
            required: true
        }
    },
    playlist: [
        {
            course: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Course"
            },
            poster: {
                type: String
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: String
})

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10)
    }
    next()
})

userSchema.methods.getJwtToken = function () {
    return Jwt.sign({ id: this._id }, process.env.JWT_TOKEN)
}

userSchema.methods.comparePassword = async function (oldpassword) {
    return await bcrypt.compare(oldpassword, this.password)
}

userSchema.methods.getResetToken = function (oldpassword) {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000

    return resetToken
}

export const User = mongoose.model("User", userSchema);