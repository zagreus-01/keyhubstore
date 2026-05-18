const User = require("../../models/user.model");
const OTP = require("../../models/otp.model");

const {
    hashPassword
} = require("../../utils/hash");
const generateOTP = require("../../utils/otp");
const sendMail = require("../../utils/sendMail");

const registerService = async (data) => {
    const existingUser =
        await User.findOne({
            email: data.email
        });

    if (existingUser) {
        throw new Error(
            "Email already exists"
        );
    }

    const passwordHash =
        await hashPassword(data.password);

    const user = await User.create({
        fullName: data.fullName,
        email: data.email,
        passwordHash,
        isVerified: false
    });

    const otp = generateOTP();

    await OTP.deleteMany({
        email: data.email,
        type: "verify-email"
    });

    await OTP.create({
        email: data.email,
        otp,
        type: "verify-email",
        expiredAt: new Date(
            Date.now() + 5 * 60 * 1000
        )
    });

    await sendMail(
        data.email,
        "Verify your email address",
        `Your verification code is: ${otp}`
    );

    return {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        isVerified: user.isVerified,
        message:
            "Registration successful. Please verify your email to log in."
    };
};

module.exports = registerService;