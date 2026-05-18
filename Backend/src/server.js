require("dotenv").config();

const mongoose = require("mongoose");

const app = require("./app");

mongoose
    .connect(process.env.MONGO_DB_URL)
    .then(() => {
        console.log("MongoDB Connected");

        app.listen(process.env.PORT, () => {
            console.log(
                `Server running on port ${process.env.PORT}`
            );
        });
    })
    .catch((error) => {
        console.log(error);
    });