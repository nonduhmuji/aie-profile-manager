require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// User schema
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

async function seed() {
  try {
    const username = "student";
    const email = process.env.DEMO_EMAIL;
    const password = process.env.DEMO_PASSWORD;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Set a valid DEMO_EMAIL in .env");
    }

    if (!password || password.length < 12) {
      throw new Error("DEMO_PASSWORD must be at least 12 characters");
    }

    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/aie_profile_app",
    );

    const normalizedEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 12);

    // Find existing demo user by email or username
    let user = await User.findOne({
      $or: [{ email: normalizedEmail }, { username }],
    });

    if (user) {
      // Avoid accidentally overwriting a different account
      const conflict = await User.findOne({
        $or: [{ email: normalizedEmail }, { username }],
        _id: { $ne: user._id },
      });

      if (conflict) {
        throw new Error(
          "Conflicting demo accounts found. Check MongoDB Compass.",
        );
      }

      user.username = username;
      user.email = normalizedEmail;
      user.password = hashedPassword;
      await user.save();

      console.log("Demo user updated successfully!");
    } else {
      await User.create({
        username,
        email: normalizedEmail,
        password: hashedPassword,
        phone: "0123456789",
        dob: new Date("2000-01-01"),
      });

      console.log("Demo user created successfully!");
    }

    console.log("Login username:", username);
    console.log("Use your DEMO_PASSWORD to log in.");
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
