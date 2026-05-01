import { createAuthClient } from "better-auth/react";
import { username } from "better-auth/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    plugins: [
        username()
    ]
});
