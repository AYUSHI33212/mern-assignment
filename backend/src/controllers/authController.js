import User from "../models/User.js";
import bcrypt from "bcrypt";
import { cookieOptions, createToken } from "../utils/token.js";
export const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  createdAt: user.createdAt,
});
export async function register(req, res, next) {
  try {
    const { name, email, password, role = "applicant" } = req.body;
    if (!["applicant", "recruiter"].includes(role))
      return res.status(400).json({
        message: "Only applicant or recruiter registration is allowed",
      });
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });
    res.status(201).json({ user: safeUser(user) });
  } catch (error) {
    if (error.code === 11000)
      return res
        .status(409)
        .json({ message: "That email is already registered" });
    next(error);
  }
}
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchesPassword(password)))
      return res.status(401).json({ message: "Incorrect email or password" });
    res
      .cookie("token", createToken(user._id), cookieOptions)
      .json({ user: safeUser(user) });
  } catch (error) {
    next(error);
  }
}
export function logout(req, res) {
  res
    .clearCookie("token", { ...cookieOptions, maxAge: undefined })
    .status(204)
    .send();
}
export const currentUser = (req, res) => res.json({ user: safeUser(req.user) });