import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Emp } from "../models/employee.model.js";
import { Attendance } from "../models/attendance.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { format } from 'date-fns';


// const createAttendance = asyncHandler(async (req, res) => {
//     // const currentEmp = await Emp.findById(req.emp._id)
//     let { checkInTime, checkOutTime, notes } = req.body;
//     checkInTime = new Date(checkInTime)
//     checkOutTime = new Date(checkOutTime)
//     const timeDiff = Math.abs(checkOutTime.getTime() - checkInTime.getTime());
//     const workHours = parseInt(Math.floor(timeDiff / (1000 * 60 * 60)));
//     const currentEmp = await Emp.findById(req.emp?._id);

//     if (!currentEmp) {
//         throw new ApiError(404, "Employee not found");
//     }
//     const currentDate = format(new Date(), 'dd-MM-yyyy');
//     console.log(currentDate);
//     // console.log("-------------", currentDateWithoutTime);

//     const existingAttendance = await Attendance.findOne({
//         employeeId: currentEmp._id,
//         date: currentDate,
//     });

//     if (existingAttendance) {
//         throw new ApiError(400, "Attendance record for this date already exists");
//     }

//     const attendance = await Attendance.create({
//         employeeId: currentEmp._id,
//         checkInTime,
//         checkOutTime,
//         workHours,
//         notes,
//         date: currentDate

//     });


//     if (!attendance) {
//         throw new ApiError(500, "Something went wrong while registering the user");
//     }
//     return res
//         .status(201)
//         .json(new ApiResponse(200, attendance, "User registered Successfully"));
// });


const createAttendance = asyncHandler(async (req, res) => {
    try {
        const { checkInTime, checkOutTime, notes } = req.body;
        const parsedCheckInTime = new Date(checkInTime);
        const parsedCheckOutTime = new Date(checkOutTime);
        const currentDate = format(new Date(), "dd-MM-yyyy");
        if (isNaN(parsedCheckInTime) || isNaN(parsedCheckOutTime)) {
            throw new ApiError(400, "Invalid date format");
        }
        const currentEmp = await Emp.findById(req.emp?._id);
        if (!currentEmp) {
            throw new ApiError(404, "Employee not found");
        }
        const existingAttendance = await Attendance.findOne({
            $and: [
                { employeeId: currentEmp._id },
                { date: currentDate }
            ]
        });
        console.log(existingAttendance)
        if (existingAttendance) {
            throw new ApiError(400, "Attendance record for this date already exists");
        }
        const timeDiff = Math.abs(
            parsedCheckOutTime.getTime() - parsedCheckInTime.getTime()
        );
        const workHours = parseInt(Math.floor(timeDiff / (1000 * 60 * 60)));
        const attendance = await Attendance.create({
            employeeId: currentEmp._id,
            checkInTime: parsedCheckInTime,
            checkOutTime: parsedCheckOutTime,
            date:currentDate,
            workHours,
            notes,
        });
        console.log(attendance)
        if (!attendance) {
            throw new ApiError(
                500,
                "Something went wrong while registering the user"
            );
        }
        return res
            .status(201)
            .json(
                new ApiResponse(
                    200,
                    attendance,
                    "Attendance record created successfully"
                )
            );
    } catch (error) {
        throw new ApiError(400, error, "internal server not running")
    }
});


const getCurentUserAttendance = asyncHandler(async (req, res) => {
    const currentEmp = await Emp.findById(req.emp?._id);
    // Fetch all attendance records
    const allAttendance = await Attendance.find({employeeId:currentEmp.id});

    if (!allAttendance || allAttendance.length === 0) {
        // If no attendance records found, you can customize the response
        return res.status(404).json(new ApiResponse(404, null, "No attendance records found"));
    }

    return res.status(200).json(new ApiResponse(200, allAttendance, "Attendance records fetched successfully"));
});

const  getUserAttendanceWithParams = asyncHandler(async (req, res) => {
    const empId = await req.params
    console.log("=========",empId);
    // Fetch all attendance records
    const allAttendance = await Attendance.find({employeeId:empId.id});

    if (!allAttendance || allAttendance.length === 0) {
        // If no attendance records found, you can customize the response
        return res.status(404).json(new ApiResponse(404, null, "No attendance records found"));
    }

    return res.status(200).json(new ApiResponse(200, allAttendance, "Attendance records fetched successfully"));
});



export {
    createAttendance,
    getCurentUserAttendance,
    getUserAttendanceWithParams
}