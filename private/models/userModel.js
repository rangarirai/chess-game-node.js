const mongoose = require("mongoose");
const { userSchemaFields } = require("./userStructure");
const userSchema = new mongoose.Schema(userSchemaFields);
const User = mongoose.model("User", userSchema);

exports.User = User;
