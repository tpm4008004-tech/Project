import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

async function getTemplateCollection() {
  const client = await clientPromise();
  const db = client.db("project_tracker");
  return db.collection("template");
}

async function getTemplate() {
  const collection = await getTemplateCollection();
  // We use a single document with _id: "main" to store the template array
  let templateDoc = await collection.findOne({ _id: "main" });
  
  if (!templateDoc) {
    const defaultTemplate = [
      { id: "t1", name: "operations head visit", subtasks: [] },
      { id: "t2", name: "operations team drawing", subtasks: [] },
      { id: "t3", name: "construction", subtasks: [] },
      { id: "t4", name: "interior designing", subtasks: [] },
      { id: "t5", name: "product and kitchen dispatch", subtasks: [] }
    ];
    await collection.insertOne({ _id: "main", tasks: defaultTemplate });
    return defaultTemplate;
  }
  
  return templateDoc.tasks;
}

export async function GET() {
  try {
    const template = await getTemplate();
    return NextResponse.json(template);
  } catch (error) {
    return NextResponse.json({ error: "Failed to read template" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const newTemplate = await request.json();
    const collection = await getTemplateCollection();
    
    await collection.updateOne(
      { _id: "main" },
      { $set: { tasks: newTemplate } },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save template" }, { status: 500 });
  }
}
