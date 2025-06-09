'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react'
import Link from 'next/link'

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

export default function CreateForm() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [fields, setFields] = useState<FormField[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  const addField = (type: FormField['type']) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: `${type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Field`,
      required: false,
      order: fields.length,
      ...(type === 'multiple-choice' && { options: ['Option 1', 'Option 2'], allowMultiple: false }),
      ...(type === 'rating' && { maxRating: 5 })
    }
    setFields([...fields, newField])
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ))
  }

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Form title is required')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          fields: fields.map((field, index) => ({ ...field, order: index }))
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Form created successfully')
        router.push(`/forms/${data.form.slug}/edit`)
      } else {
        toast.error(data.error || 'Failed to create form')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Create New Form</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Details</CardTitle>
              <CardDescription>
                Set up the basic information for your form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">
                  Form Title *
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter form title"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter form description (optional)"
                  className="w-full px-3 py-2 border border-input rounded-md resize-none h-20"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Form Fields</CardTitle>
              <CardDescription>
                Add and configure fields for your form
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{field.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(field.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Label</label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          placeholder="Field label"
                        />
                      </div>
                      
                      {(field.type === 'short-text' || field.type === 'paragraph') && (
                        <div>
                          <label className="block text-sm font-medium mb-1">Placeholder</label>
                          <Input
                            value={field.placeholder || ''}
                            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                            placeholder="Placeholder text"
                          />
                        </div>
                      )}
                      
                      {field.type === 'multiple-choice' && (
                        <div>
                          <label className="block text-sm font-medium mb-1">Options</label>
                          {field.options?.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex gap-2 mb-2">
                              <Input
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...(field.options || [])]
                                  newOptions[optionIndex] = e.target.value
                                  updateField(field.id, { options: newOptions })
                                }}
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newOptions = field.options?.filter((_, i) => i !== optionIndex)
                                  updateField(field.id, { options: newOptions })
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`]
                              updateField(field.id, { options: newOptions })
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Option
                          </Button>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`required-${field.id}`}
                          checked={field.required}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor={`required-${field.id}`} className="text-sm">
                          Required field
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">Add a field to your form</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addField('short-text')}
                      >
                        Short Text
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addField('paragraph')}
                      >
                        Paragraph
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addField('multiple-choice')}
                      >
                        Multiple Choice
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addField('file-upload')}
                      >
                        File Upload
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addField('rating')}
                      >
                        Rating
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Form'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}