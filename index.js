const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cron = require("node-cron");
const Member = require("./model/member");
const User = require("./model/user");
const { verifyJWT, generateJWT } = require("./auth");
const bcrypt = require("bcrypt");

var cors = require("cors");
mongoose
  .connect(
    "mongodb+srv://stallionfitness:stallionfitness@stallion-fitness.pjgrsef.mongodb.net/?retryWrites=true&w=majority&appName=Stallion-fitness"
  )
  .then(() => console.log("Connected!"))
  .catch(() => {
    console.log("error");
  });

const app = express();
app.use(express.json());
app.use(cors());

app.post("/user/register", async (req, res) => {
  try {
    const { name , email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Create a new user
    const user = new User({ name, email, password });
    const newUser = await user.save();

    // Send a success message with minimal data
    res
      .status(201)
      .json({ message: "Registration successful", userId: newUser._id });
  } catch (err) {
    let errorMessage = "Registration failed";
    if (err.errors) {
      // Extract specific error messages from Mongoose validation errors
      errorMessage = Object.values(err.errors)
        .map((error) => error.message)
        .join(", ");
    }
    console.error(err);
    res.status(400).json({ message: errorMessage });
  }
});

// Extract all users
app.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.post("/user/login", async (req, res) => {
  const { email, password } = req.body;

  // Validate user credentials
  try {
    const user = await User.findOne({
      $or: [{ email: email }, { name: email }]
    });
    if (!user) {
        return res.status(401).json({ message: "Invalid username" });
    }

    const validPassword = await bcrypt.compare(password, user.password); // Compare hashed passwords
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Create JWT payload
    const payload = { username: user.name, email: user.email};

    // Generate JWT using your generateJWT function
    const token = generateJWT(payload);

    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Check api status
app.get("/", (req, res) => {
  res.send("API is running");
});

// Extract all the Members from the gym
app.get("/members", async (req, res) => {
  const members = await Member.find({});
  members.sort((a, b) => {
    // First, sort by months left (ascending)
    if (a.months === 0 && b.months !== 0) {
      return -1; // a (0 months left) comes before b
    } else if (a.months !== 0 && b.months === 0) {
      return 1; // b (0 months left) comes before a
    } else {
      // If both have 0 or non-zero months left, sort by joining date
      return a.joiningDate - b.joiningDate;
    }
  });
  res.json(members);
});

// Extarct members whose subscription has expired
app.get("/members/expired", async (req, res) => {
  try {
    const expiredMembers = await Member.find({ months: 0 });
    res.json(expiredMembers);
  } catch (error) {
    console.error("Error fetching expired members:", error);
    res.status(500).json({ error: "Could not fetch expired members" });
  }
});

app.delete("/members/:id", verifyJWT, async (req, res) => {
  const memberId = req.params.id; // Extract member ID from request parameters
  try {
    const deletedMember = await Member.findByIdAndDelete(memberId);
    res.json(deletedMember);
  } catch (error) {
    res.status(500).json({ error: "Could not delete member" });
  }
});

app.put("/members/:id", verifyJWT, async (req, res) => {
  const memberId = req.params.id;
  updatedMonths = req.body.months;

  try {
    // Update the member with the provided ID
    var updatedMember = await Member.findByIdAndUpdate(
      memberId,
      { months: updatedMonths },
      { new: false }
    );

    // If the member with the provided ID does not exist, return a 404 Not Found response
    if (!updatedMember) {
      return res.status(404).json({ error: "Member not found" });
    }

    // If the update is successful, return the updated member data
    res.status(200).json(updatedMember);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not update member" });
  }
});

app.post("/members", verifyJWT, async (req, res) => {
  try {
    const member = new Member({
      name: req.body.name,
      num: req.body.num,
      iniDate: req.body.iniDate,
      months: req.body.months,
    });
    const newMember = await member.save();
    res.status(201).json(newMember);
  } catch (err) {
    console.log(err);
    res
      .send("Cant process the request")
      .statusCode(axios.HttpStatusCode.UnprocessableEntity);
  }
});

// Define your cron job to run every 24 hours
cron.schedule("0 0 * * *", async () => {
  // return 0;
  // Fetch member details from the API
  console.log("In crone job");
  const currentTime = new Date();
  const response = await axios.get("http://localhost:3001/members");
  const mem = response;
  console.log(`In crone job at ${currentTime} and data is ${mem}`);
  //       // Iterate through each member
  for (const memberData of mem.data) {
    const { _id, name, num, iniDate, months } = memberData;
    let inDate = new Date(iniDate);
    console.log("In " + name);

    // Check if today's day is the same as the joining date's day
    const today = new Date();
    if (today.getDate() === inDate.getDate()) {

      let updatedMonths = months - 1;
      if (updatedMonths < 0) updatedMonths = 0;

      if (updatedMonths == 0) {
        console.log(name + " renew membership " + updatedMonths);
        client.messages
          .create({
            body: `Dear ${name}, Your membership has expired. Please renew your membership to continue your journey at stallion-fitness.`,
            from: "+13344716171",
            to: `+91${num}`,
          })
          .then((message) => console.log(message.sid))
      }

      //   Update the member's monthsLeft in the database
      try {
        console.log("Sending " + updatedMonths);
        await Member.findOneAndUpdate({ _id }, { months: updatedMonths });
      } catch (e) {
        console.log("Error in updating", e);
      }

      
    }
  }
});

app.listen("3001", console.log("Server has started"));
