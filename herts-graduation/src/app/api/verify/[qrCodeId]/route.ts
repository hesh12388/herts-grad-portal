import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ qrCodeId: string }> }
) {
  try {
    const { qrCodeId } = await params

    if (!qrCodeId) {
      return NextResponse.json({ error: "QR Code ID is required" }, { status: 400 })
    }

    // Find the QR code and associated guest
    const qrCode = await prisma.qRCode.findUnique({
      where: { code: qrCodeId },
      include: {
        guest: true
      }
    })

    if (!qrCode) {
      return NextResponse.json({ 
        error: "Invalid QR code",
        status: "INVALID" 
      }, { status: 404 })
    }

    // Check if already scanned
    if (qrCode.status !== 'VALID') {
      return NextResponse.json({
        error: "QR code has already been used",
        status: qrCode.status,
        scannedAt: qrCode.scannedAt
      }, { status: 400 })
    }

    // Mark as scanned
    const updatedQrCode = await prisma.qRCode.update({
      where: { id: qrCode.id },
      data: {
        status: 'USED',
        scannedAt: new Date()
      },
      include: {
        guest: true
      }
    })

    return NextResponse.json({
      message: "QR code verified successfully",
      status: "SUCCESS",
      guest: {
        firstName: updatedQrCode.guest.firstName,
        lastName: updatedQrCode.guest.lastName,
        governmentId: updatedQrCode.guest.governmentId
      },
      scannedAt: updatedQrCode.scannedAt
    })

  } catch (error) {
    console.error("Error verifying QR code:", error)
    return NextResponse.json({ 
      error: "Failed to verify QR code",
      status: "ERROR" 
    }, { status: 500 })
  }
}