// We will create a Jsonwebtoken
import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, userId) => {
    // This token will be invalid after seven days
    const token = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: "7d"
    })

    res.cookie("token", token, {
        httpOnly: true, // XSS attack, This cannot be accessable by a js only http
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", // pprevents attack CSRF
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return token;
}