import { publishtoqueue } from "../config/rabbitmq.js";
import TryCatch from "../config/trycatch.js";
import { redisClient } from "../index.js";

export const loginUser = TryCatch(async (req, res) => {

    console.log("loginUser HIT");

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required." });
    }

    const rateLimitKey = `otp:ratelimit:${email}`;
    const attempts = await redisClient.get(rateLimitKey);

    // Check rate limit
    if (attempts && Number(attempts) >= 5) {
        return res.status(429).json({ 
            message: "Too many login attempts. Please try again later." 
        });
    }

    // Increase attempts
    await redisClient.incr(rateLimitKey);
    await redisClient.expire(rateLimitKey, 60);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`Generated OTP for ${email}: ${otp}`);

    // Store OTP for 5 minutes
    await redisClient.set(`otp:${email}`, otp, { EX: 300 });

    const message = {
        to: email,
        subject: "Collaborative AI OTP Code",
        text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
    };

    await publishtoqueue("send-otp", message);

    res.status(200).json({ message: "OTP sent to your email address." });
});

export const verifyOtp = TryCatch(async (req, res) => {
    
    const { email, otp } = req.body;
    
    if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required." });
    }

    const storedOtp = await redisClient.get(`otp:${email}`);
    
    if (storedOtp === otp) {
        // OTP is valid
        await redisClient.del(`otp:${email}`); // Invalidate OTP after successful verification
        return res.status(200).json({ message: "OTP verified successfully." });
    } else {
        return res.status(400).json({ message: "Invalid OTP." });
    } 

});    