import { Course } from "../models/courseModal.js";

import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import getDataUri from "../utils/dataUri.js";
import { Stats } from '../models/statModel.js'

import cloudinary from 'cloudinary'

//Get All Courses
export const getAllCourses = catchAsyncError(async (req, resp, next) => {

    const keyword = req.query.keyword || ""
    const category = req.query.category || ""


    const courses = await Course.find({
        title: {
            $regex: keyword,
            $options: "i"
        },
        category: {
            $regex: category,
            $options: "i"
        }
    }).select("-lectures");

    resp.status(200).json({
        success: true,
        courses
    })
})

//Add new course
export const createCourse = catchAsyncError(async (req, resp, next) => {
    const { title, description, category, createdBy } = req.body

    if (!title || !description || !category || !createdBy) {
        return next(new ErrorHandler('All Fields required', 400))
    }
    const file = req.file;

    const fileUri = getDataUri(file)
    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content)

    const course = await Course.create({
        title, description, category, createdBy,
        poster: {
            publicId: myCloud.public_id,
            publicUrl: myCloud.secure_url
        }
    })


    resp.status(200).json({
        success: true,
        message: "Coures created successfully",
        course
    })
})

//Get Lecture by course
export const getLecturesByCourese = catchAsyncError(async (req, resp, next) => {

    const course = await Course.findById(req.params.id)
    if (!course) {
        return next(new ErrorHandler('Coures not found', 404))
    }
    course.views += 1

    await course.save()

    resp.status(200).json({
        success: true,
        lectures: course.lectures
    })
})

//max video size 100mb
//Add Lecture to course
export const addLectureToCourese = catchAsyncError(async (req, resp, next) => {

    const { title, description } = req.body
    const course = await Course.findById(req.params.id)

    if (!course) {
        return next(new ErrorHandler('Coures not found', 404))
    }

    const file = req.file;

    const fileUri = getDataUri(file)
    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content, {
        resource_type: 'video'
    })

    course.lectures.push({
        title, description, video: {
            publicId: myCloud.public_id,
            publicUrl: myCloud.secure_url
        }
    })

    course.numOfVideos = course.lectures.length
    await course.save()

    resp.status(200).json({
        success: true,
        message: "Lecture added to course succesfully"
    })
})

//Delete Coures
export const deleteCoures = catchAsyncError(async (req, resp, next) => {

    const { id } = req.params
    const course = await Course.findById(id)

    if (!course) {
        return next(new ErrorHandler('Coures not found', 404))
    }
    await cloudinary.v2.uploader.destroy(course.poster.publicId)

    for (let i = 0; i < course.lectures.length; i++) {
        const singleLecture = course.lectures[i];
        await cloudinary.v2.uploader.destroy(singleLecture.video.publicId, {
            resource_type: "video"
        })

    }

    await course.deleteOne()

    resp.status(200).json({
        success: true,
        message: "Course Deleted Successfully"
    })
})

//Delete Lecture
export const deletelecture = catchAsyncError(async (req, resp, next) => {

    const { courseId, lectureId } = req.query
    const course = await Course.findById(courseId)

    if (!course) {
        return next(new ErrorHandler('Coures not found', 404))
    }


    const lecture = course.lectures.find((item) => {
        if (item._id.toString() === lectureId.toString()) {
            return item;
        }
    })

    await cloudinary.v2.uploader.destroy(lecture.video.publicId, {
        resource_type: "video"
    })

    course.lectures.filter((item) => {
        if (item._id.toString() !== lectureId.toString()) {
            return item;
        }
    })

    course.numOfVideos = course.lectures.length
    await course.save();

    resp.status(200).json({
        success: true,
        message: "Lecture Deleted Successfully"
    })
})

Course.watch().on("change", async () => {
    const stats = await Stats.find({}).sort({ createdAt: "Desc" }).limit(1)
    const courses = await Course.find({})

    let totalViews = 0

    for (let i = 0; i < courses.length; i++) {
        totalViews += courses[i].views
    }

    stats[0].views = totalViews
    stats[0].createdAt = new Date(Date.now())
    await stats[0].save()
})
