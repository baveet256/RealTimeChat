import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { IUser } from "../model/User.ts";

export interface IsAuthRequest extends Request {
    user? : IUser | null;
}   


export const isauth = async (req: IsAuthRequest, res: Response, next: NextFunction) : Promise<void> =>{
    try {
         const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized: No token provided." });           
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as JwtPayload;

        if (!decoded || !decoded.user) {
            return res.status(401).json({ message: "Unauthorized: Invalid token." });
        }
     
        req.user = decoded.user;
        next();
    }
    catch (error) { 
        console.error("JWT verification error:", error);
        console.log(req.headers);
        return res.status(401).json({ message: "please login: JWT error." });
    }
};        