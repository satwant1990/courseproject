import express from 'express'
import { addLectureToCourese, createCourse, deleteCoures, deletelecture, getAllCourses, getLecturesByCourese } from '../controllers/courseController.js';
import { isAuthenticated, isAuthorized, isSubscriber } from '../middlewares/auth.js';
import singleUpload from '../middlewares/multer.js';



const router = express.Router()



//Public Routes
router.route('/courses').get(getAllCourses)
router.route('/course/:id')
    .get(isAuthenticated, isSubscriber, getLecturesByCourese)
    .post(isAuthenticated, isAuthorized, singleUpload, addLectureToCourese)
    .delete(isAuthenticated, isAuthorized, deleteCoures)


// Admin Routes
router.route('/coursecreate').post(isAuthenticated, isAuthorized, singleUpload, createCourse)
router.route('/deletelecture').delete(isAuthenticated, isAuthorized, deletelecture)

export default router;