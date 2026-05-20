import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const client = await clientPromise();
    const db = client.db("project_tracker");
    const usersCol = db.collection("users");

    let logs = [];

    // Migrate Architect to Operations Head
    const archResult = await usersCol.updateMany(
      { role: "Architect" },
      { $set: { role: "Operations Head" } }
    );
    logs.push(`Migrated ${archResult.modifiedCount} "Architect" users to "Operations Head".`);

    // Migrate Franchise Owner to Operations Team
    const franchiseResult = await usersCol.updateMany(
      { role: "Franchise Owner" },
      { $set: { role: "Operations Team" } }
    );
    logs.push(`Migrated ${franchiseResult.modifiedCount} "Franchise Owner" users to "Operations Team".`);

    return NextResponse.json({ success: true, message: "Role migration complete!", logs });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.toString() }, { status: 500 });
  }
}
