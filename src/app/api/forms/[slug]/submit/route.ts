import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Form from '@/models/Form'
import FormResponse from '@/models/FormResponse'

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await dbConnect()

    const form = await Form.findOne({ slug: params.slug })

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    // Check if form is public
    if (!form.settings.isPublic) {
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

    const body = await request.json()
    const { responses } = body

    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'

    // Check for duplicate submissions if enabled
    if (form.settings.limitOneResponse) {
      const existingResponse = await FormResponse.findOne({
        formId: form._id,
        submitterIp: ip
      })

      if (existingResponse) {
        return NextResponse.json(
          { error: 'You have already submitted a response to this form' },
          { status: 400 }
        )
      }
    }

    // Validate required fields
    const requiredFields = form.fields.filter(field => field.required)
    const missingFields = requiredFields.filter(field => !responses[field.id])

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Process responses
    const processedResponses = form.fields.map(field => {
      const value = responses[field.id]
      
      // Handle file uploads (for now, just store the filename)
      if (field.type === 'file-upload' && value) {
        // In a real app, you'd upload to Cloudinary here
        return {
          fieldId: field.id,
          value: 'file-placeholder.jpg', // This would be the actual file URL
          fileUrl: 'https://example.com/file-placeholder.jpg'
        }
      }

      return {
        fieldId: field.id,
        value: value || ''
      }
    }).filter(response => response.value !== '')

    // Create form response
    const formResponse = await FormResponse.create({
      formId: form._id,
      responses: processedResponses,
      submitterIp: ip,
    })

    return NextResponse.json(
      { message: 'Form submitted successfully', responseId: formResponse._id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error submitting form:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}