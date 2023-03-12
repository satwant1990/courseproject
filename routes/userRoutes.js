import express from 'express'
import { addToPlaylist, changePassword, deleteMyProfile, deleteUserByAdmin, forgetPassword, getAllusers, getMyProfile, loginUser, logout, profilePhotoUpdate, profileUpdate, register, removeFromPlaylist, ressetPassword, updateUserRoleByAdmin } from '../controllers/userController.js';
import { isAuthenticated, isAuthorized } from '../middlewares/auth.js'
import singleUpload from '../middlewares/multer.js';

const router = express.Router()

//Public Routes

router.route('/register').post(singleUpload, register)
router.route('/login').post(loginUser)
router.route('/logout').get(logout)
router.route('/forgetpassword').post(forgetPassword)
router.route('/resetpassword/:token').put(ressetPassword)



//Protected Routes
router.route('/me').get(isAuthenticated, getMyProfile).delete(isAuthenticated, deleteMyProfile)


router.route('/changepassword').put(isAuthenticated, changePassword)
router.route('/profileupdate').put(isAuthenticated, profileUpdate)
router.route('/profilephotoupdate').put(isAuthenticated, singleUpload, profilePhotoUpdate)
router.route('/addtoplaylist').post(isAuthenticated, addToPlaylist)
router.route('/removefromplaylist').delete(isAuthenticated, removeFromPlaylist)


//Admin Routes
router.route('/admin/users').get(isAuthenticated, isAuthorized, getAllusers)
router.route('/admin/user/:id').put(isAuthenticated, isAuthorized, updateUserRoleByAdmin)
    .delete(isAuthenticated, isAuthorized, deleteUserByAdmin)



export default router;