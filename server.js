require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// User database schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    default: "",
  },
  dob: {
    type: Date,
  },
});

const User = mongoose.model("User", userSchema);

// Authentication middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      message: "Please log in first",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired session",
    });
  }
}

// LOGIN USING USERNAME AND PASSWORD
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      typeof username !== "string" ||
      !username.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    const user = await User.findOne({
      username: username.trim(),
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Incorrect username or password",
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
        algorithm: "HS256",
      },
    );

    res.json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      message: "Server error during login",
    });
  }
});

// GET USER PROFILE
app.get("/api/profile", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: "Unable to load profile",
    });
  }
});

// UPDATE USER PROFILE
app.put("/api/profile", authenticate, async (req, res) => {
  try {
    const { email, phone, dob } = req.body;

    // Email validation
    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return res.status(400).json({
        message: "Enter a valid email address",
      });
    }

    // Phone validation
    if (typeof phone !== "string" || !/^\d+$/.test(phone)) {
      return res.status(400).json({
        message: "Phone number must contain digits only",
      });
    }

    // Date validation
    if (typeof dob !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      return res.status(400).json({
        message: "Enter a valid date of birth",
      });
    }

    const date = new Date(`${dob}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== dob ||
      date > new Date()
    ) {
      return res.status(400).json({
        message: "Enter a valid date of birth",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        email: email.trim().toLowerCase(),
        phone,
        dob: date,
      },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email address already exists",
      });
    }

    console.error("Profile update error:", error.message);

    res.status(500).json({
      message: "Unable to update profile",
    });
  }
});

// CONNECT TO MONGODB AND START SERVER
async function startServer() {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error("Set a secure JWT_SECRET of at least 32 characters");
    }

    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/aie_profile_app",
    );

    await User.init();

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Startup error:", error.message);
    process.exit(1);
  }
}

startServer();
