const User = require("../../models/user.model");
const OTP = require("../../models/otp.model");

const verifyOtpService = async (
    email,
    otp,
    type = "verify-email"
) => {
    const existingOTP =
        await OTP.findOne({
            email,
            otp,
            type
        });

    if (!existingOTP) {
        throw new Error("Invalid OTP");
    }

    if (existingOTP.expiredAt < new Date()) {
        throw new Error("OTP expired");
    }

    if (type === "verify-email") {
        const user = await User.findOne({
            email
        });

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.isVerified) {
            await User.updateOne(
                { email },
                { isVerified: true }
            );
        }
    }

    await OTP.deleteMany({
        email,
        type
    });

    return true;
};

module.exports = verifyOtpService;