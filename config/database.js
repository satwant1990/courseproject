import mongoose from "mongoose";

const connectDatabse = () => {
    mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true
    })
        .then(({ connection }) => console.log(`MongoDB connected on: ${connection.host}`))
        .catch((error) => console.log(error.message))
}

export default connectDatabse;
