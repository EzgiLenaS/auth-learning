import {User} from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { generateVerificationCode } from "../utils/generateVerificationCode.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendPasswordResetEmail, sendResetSuccessEmail, sendVerificationEmail, sendWelcomeEmail } from "../mailtrap/emails.js";
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

        // QUESTION!!!***************************************************
        // Should not we open an if here for returning error just in case
        // Like could not sending the email???
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

export const verifyEmail = async (req, res) => {
    const {code} = req.body;
    try {
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: {$gt: Date.now()}
        });

        if(!user){
            return res.status(400).json({success: false, message: "Invalid verification code"});
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;

        await user.save();

        await sendWelcomeEmail(user.email, user.name);

        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        console.log("Error in verifyEmail", error);
        res.status(500).json({success: false, message: "Server error"});
    }
}
export const login = async (req, res) => {
    const { email, password } = req.body;
	try {
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ success: false, message: "Invalid credentials" });
		}
		const isPasswordValid = await bcryptjs.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(400).json({ success: false, message: "Invalid credentials" });
		}

		generateTokenAndSetCookie(res, user._id);

		user.lastLogin = new Date();
		await user.save();

		res.status(200).json({
			success: true,
			message: "Logged in successfully",
			user: {
				...user._doc,
				password: undefined,
			},
		});
	} catch (error) {
		console.log("Error in login ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};

export const logout = async (req, res) => {
    // We will clear out the cookies
    // So we will now that user is unauthanticated
    res.clearCookie("token");
    // We wrote "token" because in generateTokenAndSetCookie
    // We used "token" as a key
    res.status(200).json({success: true, message: "Logged out successfully"});
};

export const forgotPassword = async (req, res) => {
    const {email} = req.body;
    try {
        const user = await User.findOne({email});
        if(!user){
            res.status(400).json({success: false, message: "User not found"});
        }
        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = resetTokenExpiresAt;

        await user.save();

        // Send email with reset token
        await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);
        
        res.status(200).json({ success: true, message: "Password reset link sent to your email"});
    } catch (error) {
        console.log("Error in forgotPassword", error);
        res.status(400).json({ success: false, message: error.message});
    }
}

export const resetPassword = async (req, res) => {
    const {token} = req.params; // "token" come from what we wrote in auth.route.js
    const {password} = req.body;
    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiresAt: { $gt: Date.now() },
        });
        if(!user){
            return res.status(400).json({ success: false, message: "Invalid or expired reset token"});
        }

        // Update/Reset password here
        const hashedPassword = await bcryptjs.hash(password, 10);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;

        await user.save();


        await sendResetSuccessEmail(user.email);
        
        res.status(200).json({ success: true, message: "Password reset successful"});
    } catch (error) {
        console.log("Error in resetPassword", error);
        res.status(400).json({ success: false, message: error.message});
    }
}

export const checkAuth = async (req, res) => {
    try {
        // select("-password") means we don't want to send the password
        const user = await User.findById(req.userId).select("-password");
        if(!user){
            return res.status(400).json({success: false, message: "User not found"});
        }

        res.status(200).json({success: true, message: "User is authenticated", user});
    } catch (error) {
        console.log("Error in checkAuth", error);
        res.status(400).json({success: false, message: error.message});
    }
}