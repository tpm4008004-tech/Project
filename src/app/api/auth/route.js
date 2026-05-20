import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

// Helper to get users collection
async function getUsersCollection() {
  const client = await clientPromise();
  const db = client.db("project_tracker");
  return db.collection("users");
}

// Ensure admin exists
async function ensureAdminExists() {
  try {
    const collection = await getUsersCollection();
    const count = await collection.countDocuments();
    if (count === 0) {
      const hashed = await bcrypt.hash("admin123", 10);
      await collection.insertOne({
        username: "admin",
        password: hashed,
        role: "CEO"
      });
    }
  } catch (error) {
    console.error("Error ensuring admin exists:", error);
  }
}

// POST — Login
export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    // Ensure admin user exists if DB is completely empty
    await ensureAdminExists();

    const collection = await getUsersCollection();
    const user = await collection.findOne({ username });

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    // Support both bcrypt hashed and plain text (for migration, although new DB is fresh)
    const isHashed = user.password.startsWith("$2");
    const passwordMatch = isHashed
      ? await bcrypt.compare(password, user.password)
      : password === user.password;

    if (!passwordMatch) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    // Auto-upgrade plain text password to bcrypt hash on first login
    if (!isHashed) {
      const hashed = await bcrypt.hash(password, 10);
      await collection.updateOne({ username }, { $set: { password: hashed } });
    }

    return NextResponse.json({ success: true, role: user.role, username: user.username });
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

// PUT — Change password
export async function PUT(request) {
  try {
    const { username, currentPassword, newPassword } = await request.json();

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json({ success: false, error: "New password must be at least 4 characters." }, { status: 400 });
    }

    const collection = await getUsersCollection();
    const user = await collection.findOne({ username });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    const isHashed = user.password.startsWith("$2");
    const passwordMatch = isHashed
      ? await bcrypt.compare(currentPassword, user.password)
      : currentPassword === user.password;

    if (!passwordMatch) {
      return NextResponse.json({ success: false, error: "Current password is incorrect." }, { status: 401 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await collection.updateOne({ username }, { $set: { password: hashedNewPassword } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
