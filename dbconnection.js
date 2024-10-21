import mongoose from "mongoose";

const mongoURI =
  "mongodb+srv://kraj0123:raj%401234@cluster0.zcxuq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/chatdb";

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connection successful");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
