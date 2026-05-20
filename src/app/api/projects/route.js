import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

async function getProjectsCollection() {
  const client = await clientPromise();
  const db = client.db("project_tracker");
  return db.collection("projects");
}

export async function GET() {
  try {
    const collection = await getProjectsCollection();
    const projects = await collection.find({}).toArray();
    
    // Convert MongoDB _id to string or just map to hide it if needed,
    // but the frontend relies on the `id` string field we already generate.
    const sanitizedProjects = projects.map(p => {
      const { _id, ...rest } = p;
      return rest;
    });

    return NextResponse.json(sanitizedProjects);
  } catch (error) {
    return NextResponse.json({ error: "Failed to read projects" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const newProject = await request.json();
    const collection = await getProjectsCollection();
    
    // Read template from DB
    const client = await clientPromise();
    const db = client.db("project_tracker");
    const templateDoc = await db.collection("template").findOne({ _id: "main" });
    
    let templateTasks = [];
    if (templateDoc && templateDoc.tasks) {
      templateTasks = templateDoc.tasks;
    } else {
      console.warn("Could not read template from DB, using empty tasks");
    }

    const projectTasks = templateTasks.map((t, index) => ({
      ...t,
      status: "To Do",
      sequenceIndex: index,
      comments: []
    }));

    const project = {
      id: Date.now().toString(),
      title: newProject.title || "Untitled Project",
      description: newProject.description || "",
      tasks: projectTasks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await collection.insertOne(project);
    
    // Remove _id before returning to frontend
    const { _id, ...projectData } = project;
    return NextResponse.json(projectData, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add project" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const updatedProject = await request.json();
    const collection = await getProjectsCollection();
    
    const { id, ...updateFields } = updatedProject;
    updateFields.updatedAt = new Date().toISOString();
    
    const result = await collection.findOneAndUpdate(
      { id: id },
      { $set: updateFields },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    
    const { _id, ...projectData } = result;
    return NextResponse.json(projectData);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }
    
    const collection = await getProjectsCollection();
    await collection.deleteOne({ id: id });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
