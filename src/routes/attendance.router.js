import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createAttendance ,  getCurentUserAttendance ,getUserAttendanceWithParams } from "../controllers/attendance.controller.js";
const router = Router()
router.route("/attendance/createAttendance").post(verifyJWT,createAttendance)
router.route("/attendance/currentuserAttendance").get(verifyJWT, getCurentUserAttendance)
router.route("/attendance/getUserAttendanceWithParams/:id").get(verifyJWT, getUserAttendanceWithParams)

export default router