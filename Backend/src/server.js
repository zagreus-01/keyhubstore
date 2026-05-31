require("dotenv").config();

const mongoose = require("mongoose");

const app = require("./app");
const orderService = require("./services/payment/order.service");

const startOrderAutoConfirmJob = () => {
    const run = async () => {
        try {
            await orderService.autoConfirmPendingOrders();
        } catch (error) {
            console.error("Auto confirm orders failed:", error.message);
        }
    };

    run();
    const interval = setInterval(run, 60 * 1000);
    interval.unref?.();
};

mongoose
    .connect(process.env.MONGO_DB_URL)
    .then(() => {
        console.log("MongoDB Connected");
        startOrderAutoConfirmJob();

        app.listen(process.env.PORT, () => {
            console.log(
                `Server running on port ${process.env.PORT}`
            );
        });
    })
    .catch((error) => {
        console.log(error);
    });
