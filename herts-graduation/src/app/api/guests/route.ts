import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { prisma } from "@/app/lib/prisma"
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { v4 as uuidv4 } from "uuid"
import QRCode from 'qrcode'
import { Resend } from 'resend'
import twilio from 'twilio'
import jsPDF from "jspdf"

const resend = new Resend(process.env.RESEND_API_KEY)
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export async function GET(req: Request) {
  // 1. Get the session
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Fetch guests for the logged-in user
    const guests = await prisma.guest.findMany({
      where: { userId: session.user.id },
      include: { qrCode: true }
    })

    return NextResponse.json({ guests })
  } catch (error) {
    console.error("Error fetching guests:", error)
    return NextResponse.json({ error: "Failed to fetch guests" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // 1. Parse and validate form data
    const formData = await req.formData()
    const file = formData.get("idImage") as File
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const governmentId = formData.get("governmentId") as string
    const phoneNumber = formData.get("phoneNumber") as string
    const email = formData.get("email") as string

    // Basic validation
    if (!file || !firstName || !lastName || !governmentId || !phoneNumber || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate file type - accept both PDF and images for government ID
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Please upload a PDF or image file." 
      }, { status: 400 })
    }

    console.log("Validation passed, proceeding with S3 upload...")

    // 2. Upload file to S3
    const s3 = new S3Client({ region: process.env.AWS_REGION })
    const fileExtension = file.name.split('.').pop()
    const fileKey = `government-ids/${uuidv4()}.${fileExtension}`
    
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: fileKey,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    })

    await s3.send(uploadCommand)
    const idImageUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`

    console.log("S3 upload successful:", idImageUrl)

    // 3. Generate QR code
    const qrCodeId = uuidv4()
    const qrCodeUrl = `${process.env.NEXTAUTH_URL}/verify/${qrCodeId}`
    
    // Generate QR code as base64 data URL
    const qrCode = await QRCode.toDataURL(qrCodeUrl)
    const pdf = new jsPDF()
    pdf.setFontSize(22)
    pdf.text('Graduation Guest QR Code', 105, 30, { align: 'center' })
    pdf.setFontSize(14)
    pdf.text(`Name: ${firstName} ${lastName}`, 105, 45, { align: 'center' })
    pdf.text(`Government ID: ${governmentId}`, 105, 55, { align: 'center' })
    pdf.text('Please present this QR code at the event entrance.', 105, 70, { align: 'center' })

    // Draw a border around the QR code
    pdf.setDrawColor(100, 100, 100)
    pdf.rect(55, 80, 100, 100)

    pdf.addImage(qrCode, 'PNG', 60, 85, 90, 90)
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    console.log("QR code generated for:", qrCodeUrl)

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 2rem;">
        <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); padding: 2rem;">
          <h2 style="color: #9a46cf; margin-bottom: 0.5rem;">Your Graduation Guest QR Code</h2>
          <p>Hi <b>${firstName} ${lastName}</b>,</p>
          <p>Thank you for registering as a guest. Please find your QR code attached as a PDF. Present this code at the event entrance for verification.</p>
          <p>If you have trouble opening the PDF, you can also use this link:<br>
            <a href="${qrCodeUrl}" style="color: #9a46cf;">${qrCodeUrl}</a>
          </p>
          <hr style="margin: 2rem 0;">
          <p style="font-size: 0.9rem; color: #888;">If you have any questions, reply to this email.</p>
          <p style="font-size: 0.9rem; color: #888;">— Herts Cap & Gowns Team</p>
        </div>
      </div>
    `

    // Send QR code via email
    try {
      // Send email
      await resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: email,
        subject: 'Your Graduation Guest QR Code',
        html: emailHtml,
        attachments: [{
          filename: 'qr-code.pdf',
          content: pdfBuffer,
        }]
      })

      console.log("Notifications sent successfully")
    } catch (notificationError) {
      console.error("Failed to send notifications:", notificationError)
      return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 })
    }
    
    const guest = await prisma.guest.create({
      data: {
        firstName,
        lastName,
        governmentId,
        idImageUrl,
        phoneNumber,
        email,
        userId: session.user.id,
        qrCode: {
          create: {
            code: qrCodeId,
          }
        }
      },
      include: { 
        qrCode: true 
      }
    })

    console.log("Guest created successfully:", guest.id)

    return NextResponse.json({ 
      message: "Guest created and notifications sent",
      guest 
    })


  } catch (error) {
    console.error("Error creating guest:", error)
    return NextResponse.json({ error: "Failed to create guest" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const guestId = searchParams.get('id')
    
    if (!guestId) {
      return NextResponse.json({ error: "Guest ID is required" }, { status: 400 })
    }

    
    let existingGuest = null;

    if(session.user.role === 'ADMIN') {
      // Admin can delete any guest
      existingGuest = await prisma.guest.findUnique({
        where: { id: guestId },
        include: { qrCode: true }
      })
    } else {
      // Verify the guest belongs to the current user
      existingGuest = await prisma.guest.findFirst({
        where: {
          id: guestId,
          userId: session.user.id
        },
        include: { qrCode: true }
      })
    }

    if (!existingGuest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 })
    }

    try {
      const s3 = new S3Client({ region: process.env.AWS_REGION })
      
      // Extract the S3 key from the URL
      const url = new URL(existingGuest.idImageUrl)
      const s3Key = url.pathname.substring(1)
      
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: s3Key,
      })
      
      await s3.send(deleteCommand)
      console.log("S3 file deleted successfully:", s3Key)
    } catch (s3Error) {
      console.error("Failed to delete S3 file:", s3Error)
    }

    // Delete guest (QR code will be deleted automatically due to cascade)
    await prisma.guest.delete({
      where: { id: guestId }
    })

    return NextResponse.json({ message: "Guest deleted successfully", userId: existingGuest.userId })

  } catch (error) {
    console.error("Error deleting guest:", error)
    return NextResponse.json({ error: "Failed to delete guest" }, { status: 500 })
  }
}