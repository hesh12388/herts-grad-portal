import NextAuth, { type NextAuthOptions } from "next-auth"
import AzureADProvider from "next-auth/providers/azure-ad"
import { prisma } from "@/app/lib/prisma"


declare module "next-auth" {
  interface Session {
    user: {
      id: string       
      email: string
      name?: string | null
      image?: string | null
    }
  }
}


export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    error: '/',
    signIn: '/'  
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("User signing in:", user.email)
      
      try {

        if (!user.email?.endsWith('gaf.ac') && !user.email?.endsWith('outlook.com')) {
            console.log('Non-university email attempted:', user.email)
            return false // This blocks the sign-in
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })
        
        if (!existingUser) {
          // Create new graduate user
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name!,
              maxGuests: 50, // Default from your schema
            }
          })
          console.log("Created new user:", user.email)
        }
        
        return true
      } catch (error) {
        console.error('Error handling user:', error)
        return false
      }
    },

    async jwt({ token, user }) {
        if (user) {
          
            const dbUser = await prisma.user.findUnique({
            where: { email: user.email! }
            })
            
            if (dbUser) {
                token.userId = dbUser.id        
                token.email = dbUser.email   
            }
        }
        return token
    },

    async session({ session, token }) {
        if(token.userId){
            session.user.id = token.userId as string
            session.user.email = token.email as string
        }
            
        return session
    },
    async redirect({ url, baseUrl }) {
        console.log("Redirecting to:", url)
        
        if (url.startsWith(baseUrl)) {
        return url
        }
      return baseUrl
    }   
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }