const User = require("../../models/user.model");

const OTP = require("../../models/otp.model");

const generateOTP = require("../../utils/otp");

const sendMail = require("../../utils/sendMail");

const forgotPasswordService = async (
    email
) => {
    const user = await User.findOne({
        email
    });

    if (!user) {
        throw new Error(
            "Email not found"
        );
    }

    const otp = generateOTP();

    await OTP.deleteMany({
        email,
        type: "forgot-password"
    });

    await OTP.create({
        email,
        otp,
        type: "forgot-password",
        expiredAt: new Date(
            Date.now() + 5 * 60 * 1000
        )
    });

    await sendMail(
        email,
        "Reset Password OTP",
        `Your OTP is: ${otp}`,
        `<p>Use the following OTP to reset your password:</p><h2>${otp}</h2><p>This code expires in 5 minutes.</p><p>If you did not request a password reset, please ignore this message.</p>`
    );
};

module.exports =
    forgotPasswordService;