import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Form from '@/models/Form'
import FormResponse from '@/models/FormResponse'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const forms = await Form.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean()

    // Get response counts for each form
    const formsWithCounts = await Promise.all(
      forms.map(async (form) => {
        const responseCount = await FormResponse.countDocuments({ formId: form._id })
        return {
          ...form,
          _count: {
            responses: responseCount
          }
        }
      })
    )

    return NextResponse.json({ forms: formsWithCounts })
  } catch (error) {
    console.error('Error fetching forms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, fields, settings } = body

    await dbConnect()

    // Generate unique slug
    const baseSlug = title.toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    let slug = baseSlug
    let counter = 1
    
    while (await Form.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const form = await Form.create({
      title,
      description,
      slug,
      userId: session.user.id,
      fields: fields || [],
      settings: {
        isPublic: true,
        allowedEmails: [],
        limitOneResponse: false,
        limitByEmail: false,
        assignmentMode: false,
        ...settings
      }
    })

    return NextResponse.json({ form }, { status: 201 })
  } catch (error) {
    console.error('Error creating form:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}