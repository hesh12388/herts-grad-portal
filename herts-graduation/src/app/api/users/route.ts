import { NextResponse } from 'next/server'
import { prisma } from '../../lib/prisma'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // 1. Get access token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify token and get user
    const { data: { user: supabaseUser }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !supabaseUser) {
      console.error('Authentication error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 3. Get request body
    const body = await request.json()
    const { email, name } = body

    // 4. Validate that the email matches the authenticated user
    if (email !== supabaseUser.email) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 400 })
    }

    // 5. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    }

    // 6. Create new user
    const newUser = await prisma.user.create({
      data: {
        id: supabaseUser.id,
        email,
        name,
        maxGuests: 50
      }
    })

    return NextResponse.json({ user: newUser }, { status: 201 })

  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}