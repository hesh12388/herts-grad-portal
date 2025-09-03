import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { prisma } from "@/app/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { userId } = await params

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const graduate = await prisma.graduate.findUnique({
      where: { userId },
      include: { qrCode: true }
    })

    return NextResponse.json({ graduate })
  } catch (error) {
    console.error("Error fetching graduate:", error)
    return NextResponse.json({ error: "Failed to fetch graduate" }, { status: 500 })
  }
}