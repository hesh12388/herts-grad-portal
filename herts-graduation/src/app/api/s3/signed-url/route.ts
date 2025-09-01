import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { key } = await req.json()
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 })
  }

  const s3 = new S3Client({ region: process.env.AWS_REGION })
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
  })

  try {
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 })
    return NextResponse.json({ url: signedUrl })
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 })
  }
}