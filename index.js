const express = require("express");
const app = express();
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const port = 8000;
const cors = require("cors");

async function main() {
  // await mongoose.connect("mongodb://127.0.0.1:27017/hotel");
  await mongoose.connect("mongodb+srv://sanjayankarthikeyan:MPHSAS5FUiJbgKIy@cluster0.sl7ymd0.mongodb.net")
  console.log("Database Connected!");
}

app.use(express.json());
app.use(cors());

main().catch((err) => console.log(`Connection failed ${err}`));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  confirmPassword: { type: String, required: true },
});

const roomSchema = new mongoose.Schema({
  roomName: { type: String, required: true },
  price: { type: String, required: true },
  availability: { type: Number, required: true },
});

const Room = new mongoose.model("room", roomSchema);

const User = new mongoose.model("User", userSchema);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "sanjayan.karthikeyan@gmail.com",
    pass: "tzawygkqfzziqdnw",
  },
});

app.get("/rooms", async (req, res) => {
  try {
    const rooms = await Room.find();
    console.log(rooms);
    res.json(rooms);
  } catch (err) {
    res.send(err);
  }
});

app.get("/get/room/:id", async (req, res) => {
  let id = req.params["id"];
  Room.findById(id)
    .then((room) => {
      console.log(room);
      return res.send(room);
    })
    .catch((err) => res.send(err));
});

app.post("/book/room", async (req, res) => {
  try {
    const { name, email, contact, selectedRoom, checkIn } = req.body;
    console.log(selectedRoom);
    const availableRoom = await Room.findOne({ roomName: selectedRoom });
    console.log(availableRoom);

    const availability = availableRoom.availability;
    if (availability) {
      const maileOptions = {
        from: "sanjayan.karthikeyan@gmail.com",
        to: email,
        subject: "Booking Confirmation",
        text: `Your Booking has been Confirmed for ${selectedRoom}!
        Check-in: ${checkIn}
        Your Name: ${name}
        Your Email: ${email}
        Your Contact: ${contact}
        Chamber: ${selectedRoom}
      
      Thank you for choosing The Sanctuary for your upcoming stay. We can't wait to provide 
      you with a comfortable and memorable experience.
        
        Warm regards,
        The Sanctuary Team`,
      };
      await transporter.sendMail(maileOptions);
      let updatedAvailability = availableRoom.availability - 1;
      await availableRoom.updateOne({
        $set: { availability: updatedAvailability },
      });
      res.status(200).json({
        success: true,
        message: "Your Booking has been confirm. Check Your Email.",
      });
      return;
    }
    res.send("Room is not available");
  } catch (err) {
    console.log(err);
    res.status({ success: false, error: err.message });
  }
});

app.post("/add", async (req, res) => {
  try {
    const { roomName, price, availability } = req.body;
    console.log(roomName);
    let room = new Room({ roomName, price, availability });
    let savedRoom = await room.save();
    res.status(201).json({ message: "Room saved", data: savedRoom });
  } catch (err) {
    res.send(err);
  }
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .send(
          "User already exists with this email. Please use a different email"
        );
    }
    let user = new User({ name, email, password, confirmPassword });
    const savedUser = await user.save();
    res.status(201).json({
      success: true,
      message: "User register successfully",
      user: savedUser,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send("User not found with email.");
    }
    if (user.password !== password) {
      return res.status(400).send("Incorrect Password.");
    }
    res
      .status(200)
      .json({ success: true, message: "Login successful", user: user });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

app.delete("/api/rooms/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;

    //* Check if the room exists
    const room = await Room.findByIdAndDelete(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting room", error: error.message });
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));