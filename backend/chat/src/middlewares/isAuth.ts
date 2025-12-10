import type { Request } from "express";
import type { Response } from "express";
import type { NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { Document, Types } from "mongoose";

interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
}

export interface AuthenticatedRequest extends Request {
    user?: IUser | null;
}

export const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ message: " No Auth Header." });     
            return;      
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
        res.status(401).json({ message: "Unauthorized: Token missing." });
        return;
        }

        if (!process.env.JWT_SECRET_KEY) {
            throw new Error("JWT_SECRET_KEY is missing in env");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as JwtPayload;

        console.log("Decoded JWT:", decoded);
        console.log("User Decoded:", decoded.user);

        if (!decoded || !decoded.user) {
            res.status(401).json({ message: "Unauthorized: Invalid token." });
            return;
        }
        req.user = decoded.user;
        next();

    } catch (error) {
        console.error("JWT verification error:", error);
        console.log(req.headers);
        res.status(401).json({ message: "please login: JWT error." });
        return;
    }
}

export default isAuth;