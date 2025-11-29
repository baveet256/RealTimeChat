import amqp from 'amqplib';

import nodemailer from 'nodemailer';

import dotenv from 'dotenv';
dotenv.config();


export const SendOtpConsumer = async () => {
    try {
        const connection = await amqp.connect({
            protocol: 'amqp',
            hostname: process.env.RABBITMQ_HOST!,
            port: 5672,
            username: process.env.RABBITMQ_USER!,
            password: process.env.RABBITMQ_PASSWORD!,
        });

        const channel = await connection.createChannel();
        const queueName = 'send-otp';

        await channel.assertQueue(queueName, { durable: true });

        console.log(`Waiting/ Listening for OTP mails in ${queueName}...`);

        channel.consume(queueName, async (msg) => {
            if (msg) {
                const messageContent = msg.content.toString();
                const { to, subject, text } = JSON.parse(messageContent);

                // Configure nodemailer transporter
                const transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 465, 
                    secure: true,
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                });

                // Send email
                await transporter.sendMail({
                    from: "Collaborative Chat App",
                    to,
                    subject,
                    text,
                });

                console.log(`Email sent to ${to}`);

                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error("❌ Error in SendOtpConsumer:", error);
    }
}