import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// Role hierarchy — each role can only create roles below them
const ROLE_HIERARCHY = {
  "CEO": ["CPO", "PO", "Operations Head", "Operations Team"],
  "CPO": ["PO", "Operations Head", "Operations Team"],
  "PO": ["Operations Head", "Operations Team"],
};

async function getUsersCollection() {
  const client = await clientPromise();
  const db = client.db("project_tracker");
  return db.collection("users");
}

// GET — list all users (for admins)
export async function GET(request) {
  try {
    const collection = await getUsersCollection();
    const users = await collection.find({}).toArray();
    // Strip passwords before returning
    return NextResponse.json(users.map(u => ({ username: u.username, role: u.role })));
  } catch (error) {
    return NextResponse.json({ error: "Failed to read users" }, { status: 500 });
  }
}

// POST — create a new user
export async function POST(request) {
  try {
    const { callerRole, username, password, role } = await request.json();

    // Validate caller permissions
    const allowedRoles = ROLE_HIERARCHY[callerRole] || [];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "You do not have permission to create this role." }, { status: 403 });
    }

    if (!username || !password || username.length < 2 || password.length < 4) {
      return NextResponse.json({ error: "Username must be ≥ 2 chars and password ≥ 4 chars." }, { status: 400 });
    }

    const collection = await getUsersCollection();
    
    // Case-insensitive exact match
    const existingUser = await collection.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") }
    });
    
    if (existingUser) {
      return NextResponse.json({ error: "Username already exists." }, { status: 409 });
    }

    await collection.insertOne({ username, password, role });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

// DELETE — remove a user
export async function DELETE(request) {
  try {
    const { callerRole, targetUsername } = await request.json();

    const collection = await getUsersCollection();
    const target = await collection.findOne({ username: targetUsername });

    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Can only delete users with roles below you
    const allowedRoles = ROLE_HIERARCHY[callerRole] || [];
    if (!allowedRoles.includes(target.role)) {
      return NextResponse.json({ error: "You do not have permission to delete this user." }, { status: 403 });
    }

    await collection.deleteOne({ username: targetUsername });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
