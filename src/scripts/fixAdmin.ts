import { seedAdmin } from '../actions/seed';
import dbConnect from '../db/connection';
import mongoose from 'mongoose';

async function main() {
    console.log('--- Rozpoczynam naprawę konta administratora ---');
    try {
        await dbConnect();
        const result = await seedAdmin();
        if (result.success) {
            console.log('✅ SUKCES:', result.message);
            console.log('Możesz teraz spróbować zalogować się na http://localhost:3000/admin-login');
            console.log('Użytkownik: Marika');
            console.log('Hasło: wilczki');
        } else {
            console.error('❌ BŁĄD:', result.error);
        }
    } catch (error) {
        console.error('❌ WYJĄTEK:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

main();
