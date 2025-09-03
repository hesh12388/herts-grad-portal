import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { prisma } from "@/app/lib/prisma"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { v4 as uuidv4 } from "uuid"
import { Resend } from 'resend'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'

const s3 = new S3Client({ region: process.env.AWS_REGION })
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if user already has a graduate registration
    const existingGraduate = await prisma.graduate.findUnique({
      where: { userId: session.user.id }
    })

    if (existingGraduate) {
      return NextResponse.json({ error: "Graduate registration already exists" }, { status: 400 })
    }

    // Parse form data
    const formData = await req.formData()
    const name = formData.get("name") as string
    const major = formData.get("major") as string
    const dateOfBirth = formData.get("dateOfBirth") as string
    const gafIdNumber = formData.get("gafIdNumber") as string
    const governmentId = formData.get("governmentId") as string
    const file = formData.get("idImage") as File

    // Validation
    if (!name || !major || !dateOfBirth || !gafIdNumber || !governmentId || !file) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Upload file to S3
    const fileExtension = file.name.split('.').pop()
    const fileKey = `graduate-ids/${uuidv4()}.${fileExtension}`
    
    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: fileKey,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    }))

    const idImageUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`

    // Generate graduate QR code (different color scheme)
    const qrCodeId = uuidv4()
    const qrCodeUrl = `${process.env.NEXTAUTH_URL}/verify/${qrCodeId}`
    const qrCode = await QRCode.toDataURL(qrCodeUrl)

    // Create PDF with graduate styling (different colors)
    const pdf = new jsPDF()
    pdf.setFontSize(22)
    pdf.text('Graduate Registration QR Code', 105, 30, { align: 'center' })
    pdf.setFontSize(14)
    pdf.text(`Name: ${name}`, 105, 45, { align: 'center' })
    pdf.text(`Major: ${major}`, 105, 55, { align: 'center' })
    pdf.text(`GAF ID: ${gafIdNumber}`, 105, 65, { align: 'center' })
    pdf.text('Please present this QR code at graduation check-in.', 105, 80, { align: 'center' })
    
    // Draw border (different color for graduates - gold/orange theme)
    pdf.setDrawColor(218, 165, 32) // Gold color
    pdf.rect(55, 90, 100, 100)
    pdf.addImage(qrCode, 'PNG', 60, 95, 90, 90)
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    // Send confirmation email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 2rem;">
        <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); padding: 2rem;">
          <h2 style="color: #d97706; margin-bottom: 0.5rem;">Your Graduate Registration QR Code</h2>
          <p>Hi <b>${name}</b>,</p>
          <p>Congratulations! Your graduation registration has been confirmed. Please find your QR code attached as a PDF. Present this code at graduation check-in.</p>
          <p><strong>Registration Details:</strong></p>
          <ul>
            <li>Major: ${major}</li>
            <li>GAF ID: ${gafIdNumber}</li>
          </ul>
          <p>If you have trouble opening the PDF, you can also use this link:<br>
          <a href="${qrCodeUrl}" style="color: #d97706;">${qrCodeUrl}</a>
          </p>
          <hr style="margin: 2rem 0;">
          <p style="font-size: 0.9rem; color: #888;">If you have any questions, reply to this email.</p>
          <p style="font-size: 0.9rem; color: #888;">— Herts Cap & Gowns Team</p>
        </div>
      </div>
    `

    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'no-reply@herts-cap-and-gowns.com',
        to: session.user.email!,
        subject: 'Graduate Registration Confirmed',
        html: emailHtml,
        attachments: [{
          filename: 'graduate-qr-code.pdf',
          content: pdfBuffer,
        }]
      })
    } catch (emailError) {
      console.error("Failed to send email:", emailError)
      return NextResponse.json({ error: "Failed to send confirmation email" }, { status: 500 })
    }

    // Create graduate record with QR code reference
    const graduate = await prisma.graduate.create({
    data: {
        name,
        major,
        dateOfBirth: new Date(dateOfBirth),
        gafIdNumber,
        governmentId,
        idImageUrl,
        userId: session.user.id,
        qrCode: {
        create: {
            code: qrCodeId,
            type: 'GRADUATE',
        }
        }
    },
    include: {
        qrCode: true
    }
    })

    return NextResponse.json({ 
    message: "Graduate registration created successfully",
    graduate 
    })
  } catch (error) {
    console.error("Error creating graduate registration:", error)
    return NextResponse.json({ error: "Failed to create graduate registration" }, { status: 500 })
  }
}

// Add this GET method to the existing file
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const graduate = await prisma.graduate.findUnique({
      where: { userId: session.user.id },
      include: { qrCode: true }
    })

    if (!graduate) {
      return NextResponse.json({ graduate: null })
    }

    return NextResponse.json({ graduate })
  } catch (error) {
    console.error("Error fetching graduate:", error)
    return NextResponse.json({ error: "Failed to fetch graduate" }, { status: 500 })
  }
}