const router = require("express").Router();
const auth = require("../middleware/auth.middleware");

const profile = require("../controllers/user/profile.controller");
const password = require("../controllers/user/changePassword.controller");
const address = require("../controllers/user/address.controller");

// PROFILE
router.get("/profile", auth, profile.getProfile);
router.put("/profile", auth, profile.updateProfile);

// PASSWORD
router.put("/change-password", auth, password);

// ADDRESS
router.post("/address", auth, address.addAddress);
router.get("/address", auth, address.getAddresses);
router.put("/address/:id", auth, address.updateAddress);
router.delete("/address/:id", auth, address.deleteAddress);
router.put("/address/default/:id", auth, address.setDefaultAddress);

module.exports = router;