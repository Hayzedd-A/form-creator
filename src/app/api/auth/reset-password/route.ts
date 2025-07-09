import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Password validation
    const passwordRequirements = [
      { test: (p: string) => p.length >= 8, message: "Password must be at least 8 characters" },
      { test: (p: string) => /[A-Z]/.test(p), message: "Password must contain uppercase letter" },
      { test: (p: string) => /[a-z]/.test(p), message: "Password must contain lowercase letter" },
      { test: (p: string) => /\d/.test(p), message: "Password must contain number" },
      { test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p), message: "Password must contain special character" },
    ];

    const failedRequirement = passwordRequirements.find(req => !req.test(password));
    if (failedRequirement) {
      return NextResponse.json(
        { error: failedRequirement.message },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user with valid reset token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and clear reset token
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      $unset: {
        resetToken: "",
        resetTokenExpiry: "",
      },
      updatedAt: new Date(),
    });

    return NextResponse.json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "An error occurred while resetting the password" },
      { status: 500 }
    );
  }
}