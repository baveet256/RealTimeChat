import { generateToken } from "../config/generateToken.js";
import { publishtoqueue } from "../config/rabbitmq.js";
import TryCatch from "../config/trycatch.js";
import { redisClient } from "../index.js";
import { isAuth, type AuthenticatedRequest } from "../middleware/isAuth.js";
import { User } from "../model/User.js";

export const loginUser = TryCatch(async (req, res) => {

    console.log("loginUser HIT");

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required." });
    }

    const rateLimitKey = `otp:ratelimit:${email}`;
    const attempts = await redisClient.get(rateLimitKey);

    // Check rate limit
    if (attempts) {
        return res.status(429).json({ 
            message: "Too many login attempts. Please try again later." 
        });
    }

    // Increase attempts
    console.log(`OTP generation starts ${email}`);
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`Generated OTP for ${email}: ${otp}`);

    // Store OTP for 5 minutes
    await redisClient.set(`otp:${email}`, otp, { EX: 300 });

    const message = {
        to: email,
        subject: "Collaborate Pro Max",
        text: `Your OTP code is ${otp}. It is valid for 5 minutes .`,
    };

    await publishtoqueue("send-otp", message);

    res.status(200).json({ message: "OTP sent to your email address." });
});

export const verifyOtp = TryCatch(async (req, res) => {
    
    const { email, otp:enteredOtp } = req.body;
    
    if (!email || !enteredOtp) {
        return res.status(400).json({ message: "Email and OTP are required." });
    }

    const storedOtp = await redisClient.get(`otp:${email}`);

    // Convert storedOtp to string for comparison

    console.log(`Verifying OTP for ${email}: entered ${enteredOtp}, stored ${storedOtp}`);

    if (!storedOtp || String(storedOtp) !== String(enteredOtp)) {
        return res.status(400).json({ message: "OTP has expired or is invalid." });
    }
    // OTP is valid
    await redisClient.del(`otp:${email}`); // Invalidate OTP after successful verification

    console.log(`OTP verified for ${email}`);

    let user = await User.findOne({ email });

    console.log(`Fetched user for ${email}: ${user}`);

    if (!user) {
        const name = email.split("@")[0];
        user = await User.create({ name, email });
        await user.save();
    }
    console.log(`User fetched/created: ${user}`);

    // Generate a JWT using the user's id and return user + token in a single response
    const token = generateToken(user);

    console.log(`Generated token for ${email}: ${token}`);

    res.json({ message: "User is Verified!", user, token });

});   

export const myprofile = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;  // <-- correct
    res.json(user);
});

export const updateName = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = await User.findById(req.user?._id);
    if (!user) {    
        return res.status(404).json({ message: "User not found. Please login" });
        return;
    }
    user.name = req.body.name;
    await user.save();
    const token = generateToken(user);
    res.json({ message: "User Updated", user, token });
});

export const getAllUsers = TryCatch(async (req: AuthenticatedRequest, res) => {
    const users = await User.find();
    res.json(users);
});

export const getAUser = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }
    res.json(user);
});