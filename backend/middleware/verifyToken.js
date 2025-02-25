import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    /* We called cookies.token because we wrote it according to
    utils>generateTokenAndSetCookie.js. If we had written jwt (for example)
    instead of "token" over there then we would write cookies.jwt here too*/
    const token = req.cookies.token;
    if(!token) return res.status(400).json({ success:false, message:"Unauthorized - no token provided"});
    try {
        const decoded = jwt.verify();
    } catch (error) {
        
    }
}