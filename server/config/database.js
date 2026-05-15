import mongoose from 'mongoose';

export async function connectDatabase() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set');
  }
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri);
  } catch (err) {
    const hint =
      uri.startsWith('mongodb+srv') && err.code === 'ECONNREFUSED'
        ? ' (Atlas SRV DNS unreachable — check network, Atlas IP allowlist, or use a local mongodb:// URI)'
        : '';
    throw new Error(`MongoDB connection failed${hint}: ${err.message}`);
  }
}
