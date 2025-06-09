'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Star } from 'lucide-react'

interface FormField {
  id: string
  type: 'short-text' | 'paragraph' | 'multiple-choice' | 'file-upload' | 'rating'
  label: string
  required: boolean
  placeholder?: string
  options?: string[]
  allowMultiple?: boolean
  maxRating?: number
  order: number
}

interface Form {
  _id: string
  title: string
  description?: string
  slug: string
  fields: FormField[]
  settings: {
    isPublic: boolean
    allowedEmails: string[]
    limitOneResponse: boolean
    limitByEmail: boolean
    openDate?: string
    closeDate?: string
    assignmentMode: boolean
  }
}

export default function PublicForm() {
  const params = useParams()
  const slug = params.slug as string
  
  const [form, setForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchForm()
    }
  }, [slug])

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${slug}`)
      if (response.ok) {
        const data = await response.json()
        setForm(data.form)
      } else {
        toast.error('Form not found')
      }
    } catch (error) {
      toast.error('Error loading form')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return

    // Validate required fields
    const missingFields = form.fields
      .filter(field => field.required && !responses[field.id])
      .map(field => field.label)

    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(', ')}`)
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/forms/${slug}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ responses }),
      })

      if (response.ok) {
        toast.success('Form submitted successfully!')
        setSubmitted(true)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to submit form')
      }
    } catch (error) {
      toast.error('An error occurred while submitting')
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'short-text':
        return (
          <Input
            value={responses[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )

      case 'paragraph':
        return (
          <textarea
            value={responses[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-3 py-2 border border-input rounded-md resize-none h-24"
          />
        )

      case 'multiple-choice':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type={field.allowMultiple ? 'checkbox' : 'radio'}
                  name={field.id}
                  value={option}
                  checked={
                    field.allowMultiple
                      ? (responses[field.id] || []).includes(option)
                      : responses[field.id] === option
                  }
                  onChange={(e) => {
                    if (field.allowMultiple) {
                      const current = responses[field.id] || []
                      if (e.target.checked) {
                        handleInputChange(field.id, [...current, option])
                      } else {
                        handleInputChange(field.id, current.filter((item: string) => item !== option))
                      }
                    } else {
                      handleInputChange(field.id, option)
                    }
                  }}
                  className="rounded"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )

      case 'file-upload':
        return (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handleInputChange(field.id, file)
              }
            }}
            required={field.required}
            className="w-full px-3 py-2 border border-input rounded-md"
          />
        )

      case 'rating':
        return (
          <div className="flex space-x-1">
            {Array.from({ length: field.maxRating || 5 }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleInputChange(field.id, index + 1)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-6 h-6 ${
                    (responses[field.id] || 0) > index
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Form Not Found</h2>
            <p className="text-gray-600">The form you're looking for doesn't exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
            <p className="text-gray-600">Your response has been submitted successfully.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{form.title}</CardTitle>
            {form.description && (
              <CardDescription className="text-base">
                {form.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {form.fields
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label className="block text-sm font-medium">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderField(field)}
                  </div>
                ))}
              
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}