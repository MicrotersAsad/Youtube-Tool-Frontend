import { MongoClient, ObjectId } from 'mongodb';

const uri = `mongodb+srv://${process.env.NEXT_PUBLIC_DB_USER}:${process.env.NEXT_PUBLIC_DB_PASS}@cluster0.s0tv2en.mongodb.net`;

if (!process.env.NEXT_PUBLIC_DB_USER || !process.env.NEXT_PUBLIC_DB_PASS || !process.env.NEXT_PUBLIC_DB_NAME) {
  throw new Error('Please add your MongoDB credentials to .env.local');
}

let client;
let clientPromise;

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  connectTimeoutMS: 10000, // Attempt to connect for 10 seconds
};

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the value across module reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch(err => {
      console.error('MongoDB connection error:', err);
      throw err;
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable
  client = new MongoClient(uri, options);
  clientPromise = client.connect().catch(err => {
    console.error('MongoDB connection error:', err);
    throw err;
  });
}

export async function connectToDatabase() {
  if (!clientPromise) {
    client = new MongoClient(uri, options);
    clientPromise = client.connect().catch(err => {
      console.error('MongoDB connection error:', err);
      throw err;
    });
  }
  const dbClient = await clientPromise;
  const db = dbClient.db(process.env.NEXT_PUBLIC_DB_NAME);
  return { client: dbClient, db };
}

export { ObjectId };
