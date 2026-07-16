import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const passwordRequirements = [
  { test: (p: string) => p.length >= 8, message: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), message: "Contains uppercase letter" },
  { test: (p: string) => /[a-z]/.test(p), message: "Contains lowercase letter" },
  { test: (p: string) => /\d/.test(p), message: "Contains number" },
  { test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p), message: "Contains special character" },
];

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    // Validate new password requirements
    const failedRequirements = passwordRequirements.filter(req => !req.test(newPassword));
    if (failedRequirements.length > 0) {
      return NextResponse.json(
        { 
          error: "Password does not meet requirements",
          requirements: failedRequirements.map(req => req.message)
        },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password must be different from current password" },
        { status: 400 }
      );
    }

    await dbConnect();
    
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await User.findByIdAndUpdate(session.user.id, {
      password: hashedNewPassword,
      updatedAt: new Date()
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}