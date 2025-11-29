import express from "express";
import dotenv from 'dotenv';
import { SendOtpConsumer } from "./consumer.js";

dotenv.config();

SendOtpConsumer();

const app = express()

const port = process.env.PORT;

app.listen(port , ()=>{
    console.log(`Server is running on port : ${port}`)
})