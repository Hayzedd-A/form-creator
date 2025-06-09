import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Form from '@/models/Form'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await dbConnect()

    const form = await Form.findOne({ slug: params.slug }).lean()

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    // Check if form is public or if user has access
    if (!form.settings.isPublic) {
      // For now, we'll just check if it's public
      // In a real app, you'd check if the user's email is in allowedEmails
      return NextResponse.json(
        { error: 'Form is not public' },
        { status: 403 }
      )
    }

    // Check if form is within open/close dates
    const now = new Date()
    if (form.settings.openDate && new Date(form.settings.openDate) > now) {
      return NextResponse.json(
        { error: 'Form is not yet open' },
        { status: 403 }
      )
    }

    if (form.settings.closeDate && new Date(form.settings.closeDate) < now) {
      return NextResponse.json(
        { error: 'Form is closed' },
        { status: 403 }
      )
    }

    return NextResponse.json({ form })
  } catch (error) {
    console.error('Error fetching form:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}