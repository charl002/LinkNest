/**
 * Google Auth configuration using NextAuth.js
 *
 * Sets up Google OAuth with offline access and consent prompt.
 *
 * Exports:
 * - GET, POST: Route handlers for auth endpoints
 * - auth: Server-side session access
 * - signIn, signOut: Helpers to trigger auth actions
 *
 * Requires env vars:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 */
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google"

export const{
    handlers: { GET, POST },
    auth,
    signIn,
    signOut
} = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,

            authorization: {
                params: {
                    prompt: "consent",          // Asks for confirmation each time
                    access_type: "offline",
                    response_type: "code", 
                }
            }
        })
    ],
    trustHost: true
})