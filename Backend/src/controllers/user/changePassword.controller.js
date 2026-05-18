const {
    changePasswordService
} = require("../../services/user/changePassword.service");

const changePassword = async (req, res) => {
    try {
        await changePasswordService(
            req.user.id,
            req.body.oldPassword,
            req.body.newPassword
        );

        res.json({
            success: true,
            message: "Password updated"
        });
    } catch (err) {
        res.status(400).json({
            message: err.message
        });
    }
};

module.exports = changePassword;