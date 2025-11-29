import amqp from 'amqplib';

let channel: amqp.Channel;


export const connectRabbitMQ = async () => {

    try {
        const connection = await amqp.connect({
            protocol: 'amqp',
            hostname: process.env.RABBITMQ_HOST!,
            port: 5672,
            username: process.env.RABBITMQ_USER!,
            password: process.env.RABBITMQ_PASSWORD!,
        });
        channel =  await connection.createChannel();
        console.log("Yay!, Connected to RabbitMQ");

    } catch (error) {
        console.error("❌ RabbitMQ connection error:", error);
        process.exit(1); // Stop the app if RabbitMQ connection fails
    }
}

export const publishtoqueue = async (queueName:string , message:any) => {
    if (!channel) {
        console.error("RabbitMQ channel is not established.");
        return;
    }
    await channel.assertQueue(queueName, { durable: true });

    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
        persistent: true,
    });
}