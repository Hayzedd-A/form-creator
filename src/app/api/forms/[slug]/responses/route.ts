import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Form from '@/models/Form'
import FormResponse from '@/models/FormResponse'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    // First, verify the form belongs to the user
    const form = await Form.findOne({ 
      slug: params.slug,
      userId: session.user.id 
    })

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    // Fetch responses for this form
    const responses = await FormResponse.find({ formId: form._id })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ responses })
  } catch (error) {
    console.error('Error fetching form responses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}