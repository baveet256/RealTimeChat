import mongoose from "mongoose";

const connectDb = async () => {
  const url = process.env.MONGO_URI;

  if (!url) {
    throw new Error("MONGO_URI is not defined in environment variables file!");
  }

  try {
    await mongoose.connect(url, {
      dbName: "realtimechat",
    } as mongoose.ConnectOptions);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // Stop the app if DB connection fails
  }
};

export default connectDb;
