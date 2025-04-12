import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

// Define the User type expected by NextAuth
type User = {
  id: string;
  name?: string;
  email: string;
}

// Extend the session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('=== NextAuth authorize function called ===');
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }
        
        try {
          console.log('Querying database for user...');
          
          // Use direct SQL query to ensure we get the user
          const users = await db.select()
            .from(schema.users)
            .where(eq(schema.users.email, credentials.email))
            .all();
          
          if (users.length === 0) {
            console.log('No user found with email:', credentials.email);
            return null;
          }
          
          const user = users[0];
          
          if (!user.password) {
            console.log('User has no password stored');
            return null;
          }
          
          // Verify password using bcrypt
          let isPasswordValid = false;
          
          try {
            // Try bcrypt first
            isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          } catch (bcryptError) {
            console.error('bcrypt.compare error:', bcryptError);
            
            // If bcrypt fails, try direct comparison as fallback
            isPasswordValid = user.password === credentials.password;
          }
          
          if (!isPasswordValid) {
            console.log('Invalid password');
            return null;
          }
          
          console.log('Login successful');
          // Return a properly typed User object
          return { 
            id: user.id.toString(), // id is required by NextAuth
            email: user.email,
            name: user.email.split('@')[0] // Use part of email as name
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-fallback-secret-key-for-development',
  debug: process.env.NODE_ENV === 'development',
};
