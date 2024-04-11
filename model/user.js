const mongoose = require("mongoose");
const bcrypt = require('bcrypt');


const userSchema = new mongoose.Schema(
  {
    name:{
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
      
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 6 characters long"],
    },
  }
);
userSchema.pre('save', async function (next) {
    // Hash the password before saving the user
    const user = this; // This refers to the current user document
  
    if (user.isModified('password')) {
      user.password = await bcrypt.hash(user.password, 10); // Use bcrypt for secure password hashing
    }
    next();
  });
module.exports = mongoose.model("User", userSchema);

// export default
