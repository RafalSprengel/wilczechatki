import mongoose from 'mongoose';
import '@/db/models/Booking';
import '@/db/models/Property';
import '@/db/models/PropertyPrices'; // ← nowy model
import '@/db/models/Season';         // ← potrzebny dla middleware kaskadowego
import '@/db/models/PriceConfig';
import '@/db/models/SystemConfig';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define MONGODB_URI in .env.local (Atlas: mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority, Local: mongodb://127.0.0.1:27017/<db>)'
  );
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI as string)
      .then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;