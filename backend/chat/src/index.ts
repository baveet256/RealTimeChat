import express from 'express';

import dotenv from 'dotenv';
import chatRoutes from './routes/chat.js';
import connectDb from './config/db.js';
dotenv.config()

connectDb();

const app = express();

app.use(express.json());

const port = process.env.PORT;
;
app.use("/api/v1", chatRoutes);

app.listen(port, () => {
    console.log(`Server is running on port : ${port}`);
});