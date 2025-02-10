import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    name:{
        type: String,
        required: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: String, // Token for update password
    resetPasswordExpiresAt: Date, // For security password expires after an hour
    verificationToken: String, // To be able to verify their accounts
    verificationTokenExpiresAt: Date, // For security 1 day for example
},{
    // CreatAt and updateAt fields will be 
    // Automatically added into the document/database
    timestamps: true});
    
export const User = mongoose.model("User", userSchema);



