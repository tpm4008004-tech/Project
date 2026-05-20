const { MongoClient } = require("mongodb");
const fs = require("fs/promises");
const path = require("path");

// WARNING: DO NOT COMMIT THIS FILE IF YOU PUT YOUR PASSWORD IN IT.
// Replace the string below with your actual MongoDB connection string.
const MONGODB_URI = "mongodb+srv://AdminUser:Admin2026thechaikaapi@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority";

async function migrate() {
  if (MONGODB_URI === "REPLACE_WITH_YOUR_MONGODB_CONNECTION_STRING") {
    console.error("❌ Please edit this file and paste your MongoDB connection string into the MONGODB_URI variable.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db("project_tracker");
    console.log("✅ Connected successfully!");

    // 1. Migrate Users
    try {
      const usersData = await fs.readFile(path.join(__dirname, "data", "users.json"), "utf8");
      const users = JSON.parse(usersData);
      if (users.length > 0) {
        console.log(`Migrating ${users.length} users...`);
        const usersCol = db.collection("users");
        await usersCol.deleteMany({}); // Clear existing
        await usersCol.insertMany(users);
        console.log("✅ Users migrated.");
      }
    } catch (e) {
      console.log("No users.json found or empty, skipping.");
    }

    // 2. Migrate Projects
    try {
      const projectsData = await fs.readFile(path.join(__dirname, "data", "projects.json"), "utf8");
      const projects = JSON.parse(projectsData);
      if (projects.length > 0) {
        console.log(`Migrating ${projects.length} projects...`);
        const projectsCol = db.collection("projects");
        await projectsCol.deleteMany({});
        await projectsCol.insertMany(projects);
        console.log("✅ Projects migrated.");
      }
    } catch (e) {
      console.log("No projects.json found or empty, skipping.");
    }

    // 3. Migrate Template
    try {
      const templateData = await fs.readFile(path.join(__dirname, "data", "template.json"), "utf8");
      const template = JSON.parse(templateData);
      if (template.length > 0) {
        console.log(`Migrating template...`);
        const templateCol = db.collection("template");
        await templateCol.updateOne(
          { _id: "main" },
          { $set: { tasks: template } },
          { upsert: true }
        );
        console.log("✅ Template migrated.");
      }
    } catch (e) {
      console.log("No template.json found or empty, skipping.");
    }

    console.log("\n🎉 All data has been successfully pushed to the MongoDB server!");
    console.log("Your Vercel app will now display all your existing projects and users.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await client.close();
  }
}

migrate();
