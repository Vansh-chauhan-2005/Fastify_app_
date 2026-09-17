const User = require("../models/user.js");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

exports.register = async (request, reply) => {
  try {
    const { name, email, password, country } = request.body;
    const hashedPassword = await bcrypt.hash(password, 12);

    // Fixed: Use User instead of UserActivation
    const user = new User({
      name,
      email,
      password: hashedPassword,
      country,
    });

    await user.save();
    reply.code(201).send({ message: "User registered successfully" });
  } catch (err) {
    reply.send(err);
  }
};

exports.login = async (request, reply) => {
  try {
    const { email, password } = request.body;
    const user = await User.findOne({ email });
    if (!user) {
      return reply.code(400).send({ message: "Invalid email or password" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return reply.code(400).send({ message: "Incorrect password" });
    }

    const token = request.server.jwt.sign({ id: user._id });
    reply.send({ token });
  } catch (err) {
    reply.send(err);
  }
};

exports.forgotPassword = async (request, reply) => {
  try {
    const { email } = request.body;
    const user = await User.findOne({ email });
    if (!user) {
      return reply.notFound("User not found");
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetPasswordExpire;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `http://localhost:${process.env.PORT}/api/auth/reset-password/${resetToken}`;

    reply.send({ resetUrl });
    // Removed stray "reset;" keyword here
  } catch (err) {
    reply.send(err);
  }
};

exports.resetPassword = async (request, reply) => {
  try {
    const resetToken = request.params.token;
    const { newPassword } = request.body;

    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return reply.badRequest("Invalid or expired reset token");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;

    await user.save();

    reply.send({ message: "Password reset successful" });
  } catch (err) {
    reply.send(err);
  }
};

exports.logout = async (request, reply) => {
  // JWT are stateless, manage via client-side removal or token blacklisting
  reply.send({ message: "User logged out successfully" });
};
