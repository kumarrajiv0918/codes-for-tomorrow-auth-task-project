const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendResetPasswordEmail = require('../utils/mailer')
const crypto = require("crypto");
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      res.status(400).send({
        status: false,
        message: "All field is required",
      });
    }
    const [isEmail] = await db.query("SELECT email FROM users WHERE email=?", [
      email,
    ]);
    if (isEmail.length > 0) {
      res.status(400).send({
        message: "Email id already exist",
      });
    } else {
      const hashPassword = await bcrypt.hash(password, 10);
      const query =
        "INSERT INTO users (firstName, lastName, email, password) VALUES (?,?,?,?)";
      const [create] = await db.query(query, [
        firstName,
        lastName,
        email,
        hashPassword,
      ]);
      const id = create.insertId;
      const [result] = await db.query("SELECT * FROM users WHERE id= ?", [id]);
      if (!result) {
        res.status(400).send({
          message: "User not create",
        });
      }
      res.status(201).send({
        status: true,
        message: "User created successfully!",
        data: result,
      });
    }
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.message,
      data: null,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).send({
        message: "email and password is requirred",
      });
    }
    const [row] = await db.query("SELECT * FROM users WHERE email= ?", [email]);
    if (row.length === 0) {
      res.status(401).send({
        message: "invalid credentials",
      });
    }
    const user = row[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).send({
        message: "invalid credentials",
      });
    }
    const token = jwt.sign({ userid: user.id }, process.env.JWt_SECRET, {
      expiresIn: "1h",
    });
    const query = "UPDATE users SET token=? WHERE email= ?";
    const uptateToken = await db.query(query, [token, email]);
    if (!uptateToken.length > 0) {
      res.status(401).send({
        message: "token is not update",
      });
    }
    res.status(200).send({
      status: true,
      message: "Login successfully!",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.message,
    });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiration = new Date(Date.now() + 300000);

    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (user.length === 0) {
      res.status(404).send({
        message: "User not found!",
      });
    }
    const query =
      "UPDATE users SET resetToken=?, resetTokenExpiration = ?  WHERE email=?";
    await db.query(query, [resetToken, expiration, email]);
    const sendmail = sendResetPasswordEmail(email, resetToken)
    res.status(200).send({
      message: "Reset link send",
      resetToken,
    });
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).send({
        message: "Reset token and new password are required",
        status: false
      });
    }

    const query =
      "SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiration > NOW()";
    const [rows] = await db.query(query, [resetToken]);

    if (rows.length === 0) {
      return res.status(400).send({
        message: "Invalid or expired reset token",
        status: false
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updateQuery =
      "UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiration = NULL WHERE id = ?";
    await db.query(updateQuery, [hashedPassword, rows[0].id]);

    return res.status(200).send({
      message: "Password has been reset successfully",
      status: true
    });

  } catch (error) {
    return res.status(500).send({
      message: error.message || "Internal server error",
      status: false
    });
  }
};
module.exports = { register, login, forgotPassword, resetPassword };
