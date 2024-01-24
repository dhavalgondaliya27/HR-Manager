import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { applyLeave ,updateLeaveStatus , onLeaveToday} from "../controllers/leave.controller.js";
const router = Router()
router.route("/leave/leaveApply").post(verifyJWT,applyLeave)
router.route("/leave/updateleave").put(verifyJWT,updateLeaveStatus)
router.route("/leave/onLeaveToday").get(verifyJWT,onLeaveToday)
export default router