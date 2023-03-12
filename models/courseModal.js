import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please enter title']
    },
    description: {
        type: String,
        required: [true, 'Please enter description'],
        minLength: [10, 'Description must be at least 10 characters']
    },
    lectures: [
        {
            title: {
                type: String,
                required: true
            },
            description: {
                type: String,
                required: true
            },
            video: {
                publicId: {
                    type: String,
                    required: true
                },
                publicUrl: {
                    type: String,
                    required: true
                }
            },
        }
    ],
    poster: {
        publicId: {
            type: String,
            required: true
        },
        publicUrl: {
            type: String,
            required: true
        }
    },
    views: {
        type: Number,
        default: 0
    },
    numOfVideos: {
        type: Number,
        default: 0
    },
    category: {
        type: String,
        required: [true, 'Please enter category']
    },
    createdBy: {
        type: String,
        required: [true, 'Please enter author name']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
})

export const Course = mongoose.model("Course", courseSchema);