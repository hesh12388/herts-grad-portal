import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { prisma } from "@/app/lib/prisma"
import { S3Client, HeadObjectCommand, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const s3 = new S3Client({ region: process.env.AWS_REGION })
  const now = new Date()
  const timestamp = now.toISOString().replace(/[:.]/g, '-')
  const fileKey = `exports/guests-list-${timestamp}.pdf`

  const guests = await prisma.guest.findMany({
    include: { user: true }
  })

  // Generate PDF 
  const pdf = new jsPDF()
  pdf.setFontSize(18)
  pdf.text('Guests List', 105, 20, { align: 'center' })

  autoTable(pdf, {
    startY: 30,
    head: [['Name', 'Email', 'Phone', 'Graduate']],
    body: guests.map(g => [
      `${g.firstName} ${g.lastName}`,
      g.email,
      g.phoneNumber,
      g.user.name
    ]),
    styles: { fontSize: 10, cellPadding: 2 },
    headStyles: { fillColor: [154, 70, 207] },
    theme: 'grid'
  })

  const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: fileKey,
    Body: pdfBuffer,
    ContentType: "application/pdf",
  }))

  // Return presigned URL
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: fileKey }),
    { expiresIn: 60 * 10 }
  )
  return NextResponse.json({ url })
}