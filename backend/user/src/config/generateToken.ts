import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const generateToken = (user: any) => {
    const payload = { user };
    // Use JWT_SECRET_KEY from env, fallback to a dev secret to avoid runtime crash
    const secret = (process.env.JWT_SECRET_KEY as string) || 'dev_secret_key';
    // Token valid for 4 days
    const options = { expiresIn: 86400 * 4 };
    return jwt.sign(payload, secret, options);
};