import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    // baseURL musi wskazywać na adres np wilczechatki.vercel.app/api/auth, ale 
    // W środowisku lokalnym to http://localhost:3000
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL 
});