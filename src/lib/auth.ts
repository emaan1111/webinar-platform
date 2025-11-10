import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          console.log('🔐 Auth attempt for:', credentials?.email)
          
          if (!credentials?.email || !credentials?.password) {
            console.log('❌ Missing credentials')
            throw new Error('Invalid credentials')
          }

          console.log('📡 Attempting to query database...')
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          console.log('👤 User found:', user ? 'YES' : 'NO')
          if (user) {
            console.log('📧 User email:', user.email)
            console.log('🔑 Has password:', user?.password ? 'YES' : 'NO')
          }

          if (!user || !user.password) {
            console.log('❌ User not found or no password')
            throw new Error('Invalid credentials')
          }

          console.log('🔐 Comparing passwords...')
          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          )

          console.log('✓ Password correct:', isCorrectPassword)

          if (!isCorrectPassword) {
            console.log('❌ Incorrect password')
            throw new Error('Invalid credentials')
          }

          console.log('✅ Authentication successful for:', user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('🚨 Auth error:', error)
          throw error
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).role = token.role as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}
