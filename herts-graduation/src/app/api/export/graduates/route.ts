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
  const fileKey = `exports/graduates-list-${timestamp}.pdf`
  const graduates = await prisma.graduate.findMany({
    include: { user: true }
  })

  // Generate PDF
  const pdf = new jsPDF()
  pdf.setFontSize(18)
  pdf.text('Graduates List', 105, 20, { align: 'center' })

  autoTable(pdf, {
    startY: 30,
    head: [['Name', 'Major', 'GAF ID', 'Email']],
    body: graduates.map(g => [
      g.name,
      g.major,
      g.gafIdNumber,
      g.user.email
    ]),
    styles: { fontSize: 10, cellPadding: 2 },
    headStyles: { fillColor: [217, 119, 6] },
    theme: 'grid',
    columnStyles: {
      0: { cellWidth: 40 }, // Name
      1: { cellWidth: 40 }, // Major
      2: { cellWidth: 35 }, // GAF ID
      3: { cellWidth: 70 }, // Email
    }
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
    new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: fileKey, ResponseContentDisposition: 'attachment; filename="graduates-list.pdf"' }),
    { expiresIn: 60 * 10 }
  )
  return NextResponse.json({ url })
}