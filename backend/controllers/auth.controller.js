import {User} from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import { generateVerificationCode } from "../utils/generateVerificationCode.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendVerificationEmail } from "../mailtrap/emails.js";
export const signup = async (req, res) => {
    const {email, password, name} = req.body;
    try {
        if(!email || !password || !name){
            throw new Error("All fields are required");
        }
        const userAlreadyExists = await User.findOne({email});
        if(userAlreadyExists){
            return res.status(400).json({success: false, message: "User already exists"});
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const verificationToken = generateVerificationCode();
        // 123456 => hashedPassword and not readable like => )2(8re%&lvdnvs
        // We dont want to seen the password as it is
        // If our database is stolen they should not see the passwords 
        // Of the users with hashedPassword
        const user = new User({
            email,
            password: hashedPassword,
            name,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });

        await user.save();
        // Authenticate them in client by creating a token
        // After creation we will send a verification code to their email
        // jwt
        generateTokenAndSetCookie(res, user._id);
        await sendVerificationEmail(user.email, verificationToken);

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user:{
                // This means spread the user document but
                ...user._doc,
                // Remove the password part.
                // We don't want to send it to the client
                password: undefined
            }
        });


    } catch (error) {
        res.status(400).json({success: false, message: error.message});
    }
};

export const login = async (req, res) => {
    res.send("Login")
};

export const logout = async (req, res) => {
    res.send("Logout")
};