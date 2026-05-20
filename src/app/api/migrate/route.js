import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import fs from "fs/promises";
import path from "path";

export async function GET(request) {
  try {
    const client = await clientPromise();
    const db = client.db("project_tracker");
    let logs = [];

    // 1. Migrate Users
    try {
      const usersData = await fs.readFile(path.join(process.cwd(), "data", "users.json"), "utf8");
      const users = JSON.parse(usersData);
      if (users.length > 0) {
        const usersCol = db.collection("users");
        await usersCol.deleteMany({});
        await usersCol.insertMany(users);
        logs.push(`✅ Migrated ${users.length} users.`);
      }
    } catch (e) {
      logs.push("⚠️ No users.json found or empty.");
    }

    // 2. Migrate Projects
    try {
      const projectsData = await fs.readFile(path.join(process.cwd(), "data", "projects.json"), "utf8");
      const projects = JSON.parse(projectsData);
      if (projects.length > 0) {
        const projectsCol = db.collection("projects");
        await projectsCol.deleteMany({});
        await projectsCol.insertMany(projects);
        logs.push(`✅ Migrated ${projects.length} projects.`);
      }
    } catch (e) {
      logs.push("⚠️ No projects.json found or empty.");
    }

    // 3. Migrate Template
    try {
      const templateData = await fs.readFile(path.join(process.cwd(), "data", "template.json"), "utf8");
      const template = JSON.parse(templateData);
      if (template.length > 0) {
        const templateCol = db.collection("template");
        await templateCol.updateOne(
          { _id: "main" },
          { $set: { tasks: template } },
          { upsert: true }
        );
        logs.push("✅ Migrated template.");
      }
    } catch (e) {
      logs.push("⚠️ No template.json found or empty.");
    }

    return NextResponse.json({ success: true, message: "Migration complete!", logs });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.toString() }, { status: 500 });
  }
}
