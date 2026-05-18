const User = require("../../models/user.model");

const OTP = require("../../models/otp.model");

const verifyOtpService = require("./verifyOtp.service");

const {
    hashPassword
} = require("../../utils/hash");

const resetPasswordService = async (
    email,
    otp,
    newPassword
) => {
    await verifyOtpService(
        email,
        otp,
        "forgot-password"
    );

    const passwordHash =
        await hashPassword(newPassword);

    await User.updateOne(
        {
            email
        },
        {
            passwordHash
        }
    );

    await OTP.deleteMany({
        email,
        type: "forgot-password"
    });
};

module.exports = resetPasswordService;