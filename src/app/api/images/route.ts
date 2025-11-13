import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

// Simple ID generator
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// GET /api/images - List all images
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'HOST')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const images = await (prisma as any).image.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(images)
  } catch (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
  }
}

// POST /api/images - Upload new image
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'HOST')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const tags = formData.get('tags') as string | null
    const description = formData.get('description') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFilename = `${Date.now()}-${generateId()}.${fileExtension}`
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    const filePath = join(uploadDir, uniqueFilename)

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Get image dimensions using sharp
    let width: number | undefined
    let height: number | undefined
    
    try {
      const metadata = await sharp(buffer).metadata()
      width = metadata.width
      height = metadata.height
    } catch (error) {
      console.error('Error getting image dimensions:', error)
    }

    // Write file to disk
    await writeFile(filePath, buffer)

    // Save to database
    const image = await (prisma as any).image.create({
      data: {
        id: generateId() + generateId(),
        filename: uniqueFilename,
        originalName: file.name,
        url: `/uploads/${uniqueFilename}`,
        size: file.size,
        mimeType: file.type,
        width,
        height,
        uploadedBy: session.user.id,
        tags,
        description
      }
    })

    return NextResponse.json(image, { status: 201 })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
