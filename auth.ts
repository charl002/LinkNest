import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google"

NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,

            authorization: {
                params: {
                    promt: "consent", 
                    access_type: "offline",
                    response_type: "code",
                }
            }
        })
    ]
})