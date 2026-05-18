const normalizeRole = (role) => {
    if (!role) return "";

    const lower = String(role).trim().toLowerCase();

    if (lower === "user") return "customer";
    if (lower === "customer") return "customer";
    if (lower === "staff") return "staff";
    if (lower === "admin") return "admin";

    return lower;
};

const checkRole = (...roles) => {
    const allowed = roles.map(normalizeRole);

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const userRole = normalizeRole(req.user.role);

        if (!allowed.includes(userRole)) {
            return res.status(403).json({
                message: `Forbidden: role '${userRole}' not allowed, requires [${allowed.join(", ")}]`
            });
        }

        next();
    };
};

module.exports = checkRole;