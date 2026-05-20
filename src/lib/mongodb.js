import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    if (uri) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
  }
  clientPromise = global._mongoClientPromise;
} else {
  if (uri) {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

// In Next.js, modules are executed at build time. We don't want to throw an error 
// if MONGODB_URI is missing during the build step, only during runtime.
const getClientPromise = () => {
  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }
  return clientPromise;
}

export default getClientPromise;
