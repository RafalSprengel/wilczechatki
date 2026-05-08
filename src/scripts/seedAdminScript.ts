import mongoose from 'mongoose';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { username } from 'better-auth/plugins';
import type { Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('Brak MONGODB_URI w .env.local');

const admins = [
  {
    email: 'kontakt@wilczechatki.pl',
    password: 'wilczki',
    name: 'Marika',
    username: 'Marika',
  },
  {
    email: 'sprengel.rafal@gmail.com',
    password: 'wilczki',
    name: 'Rafał',
    username: 'Rafal',
  },
];

async function main() {
  await mongoose.connect(MONGODB_URI as string);
  const db = mongoose.connection.db as Db;

  const auth = betterAuth({
    database: mongodbAdapter(db),
    emailAndPassword: { enabled: true, minPasswordLength: 5 },
    user: {
      additionalFields: {
        role: { type: 'string', required: true, defaultValue: 'user', input: true },
        displayUsername: { type: 'string', required: false, input: true },
      },
    },
    plugins: [username()],
    secret: process.env.BETTER_AUTH_SECRET ?? 'dev-secret',
    trustedOrigins: [process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'],
  });

  const emails = admins.map((a) => a.email);
  const usernames = admins.map((a) => a.username);

  const deleted = await db.collection('user').deleteMany({
    $or: [{ email: { $in: emails } }, { username: { $in: usernames } }],
  });
  await db.collection('account').deleteMany({});
  console.log(`Usunięto ${deleted.deletedCount} starych rekordów.`);

  for (const admin of admins) {
    await auth.api.signUpEmail({
      body: { email: admin.email, password: admin.password, name: admin.name },
    });

    await db.collection('user').updateOne(
      { email: admin.email },
      {
        $set: {
          emailVerified: true,
          role: 'admin',
          username: admin.username.toLowerCase(),
          displayUsername: admin.username,
        },
      }
    );

    console.log(`✓ Utworzono admina: ${admin.username} (${admin.email})`);
  }

  await mongoose.disconnect();
  console.log('Gotowe.');
}

main().catch((err) => {
  console.error('Błąd:', err);
  process.exit(1);
});
