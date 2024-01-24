import { Router } from "express";
import { 

    loginUser, 
    logoutUser, 
    registerEmp, 
    // refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentEmp, 
    onBirthdayToday,
    updateProfileImage,
    updateAccountDetails
} from "../controllers/employee.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/emp/register").post(
    upload.fields([
        
        {
            name: "profileImage",
            maxCount: 1
        }
    ]),
    registerEmp
    )
router.route("/emp/login").get(loginUser)
router.route("/emp/logout").post(verifyJWT,  logoutUser)
router.route("/emp/current-emp").get(verifyJWT, getCurrentEmp)
router.route("/emp/birthday").get(verifyJWT, onBirthdayToday)
router.route("/emp/changepassword").put(verifyJWT,changeCurrentPassword)

router.route("/emp/updateAccountDetails").put(verifyJWT,updateAccountDetails)
router.route("/emp/updateProfileImage").put(verifyJWT, upload.single("profileImage"), updateProfileImage)
export default router