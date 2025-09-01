import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { prisma } from "@/app/lib/prisma"
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { v4 as uuidv4 } from "uuid"
import QRCode from 'qrcode'
import { Resend } from 'resend'
import twilio from 'twilio'

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
    const qrCodeDataURL = await QRCode.toDataURL(qrCodeUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    console.log("QR code generated for:", qrCodeUrl)

    // Send QR code via email
    try {
      // Send email
      await resend.emails.send({
        from: process.env.FROM_EMAIL! ,
        to: email,
        subject: 'Your Cap and Gowns Invite - QR Code Inside',
        html: `
          <h2>Hey ${firstName},</h2>
          <p>You've been invited! Here's your QR code for entry:</p>
          <img src="${qrCodeDataURL}" alt="Your QR Code" style="display: block; margin: 20px auto;" />
          <p>Please save this QR code to your phone and present it at the event.</p>
        `
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

    // Verify the guest belongs to the current user
    const existingGuest = await prisma.guest.findFirst({
      where: {
        id: guestId,
        userId: session.user.id
      },
      include: { qrCode: true }
    })

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

    return NextResponse.json({ message: "Guest deleted successfully" })

  } catch (error) {
    console.error("Error deleting guest:", error)
    return NextResponse.json({ error: "Failed to delete guest" }, { status: 500 })
  }
}