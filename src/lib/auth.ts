import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.usuario.findUnique({
            where: { 
              username: credentials.username 
            },
            include: {
              restaurante: {
                select: {
                  id: true,
                  nome: true,
                }
              }
            }
          })

          if (!user || !user.ativo) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.senha)

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            name: user.nome,
            email: user.email,
            username: user.username,
            role: user.perfil,
            restauranteId: user.restauranteId,
            restaurante: user.restaurante,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.restauranteId = user.restauranteId
        token.restaurante = user.restaurante
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = token.role as string
        session.user.restauranteId = token.restauranteId as string
        session.user.restaurante = token.restaurante as any
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
}