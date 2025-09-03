import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { prisma } from "@/app/lib/prisma"
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  
  const skip = (page - 1) * limit

  try {

    const whereClause = {
        ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } }
        ]
      })
    }
    const [users, totalCount, totalGuests, totalGraduates] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { 
              guests: true,
            }
          },
          graduate: {
            select: { id: true }
          }
        }
      }),
      prisma.user.count({ where: whereClause }),
      prisma.guest.count(), 
      prisma.graduate.count()
    ])
    const hasNextPage = skip + limit < totalCount

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage
      },
      stats: {
        totalUsers: totalCount,
        totalGuests,
        totalGraduates
      }
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}