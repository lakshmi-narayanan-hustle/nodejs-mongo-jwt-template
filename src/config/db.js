import mongoose from "mongoose";

const connectDB = async ()=>{
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('Data Base Connected');
    } catch (error) {
        console.log('Data Base Not Connected');

        console.log(error.message);
    }
}

export { connectDB }