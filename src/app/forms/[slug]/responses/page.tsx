'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Download, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface FormResponse {
  _id: string
  responses: Array<{
    fieldId: string
    value: any
    fileUrl?: string
  }>
  submitterEmail?: string
  submitterIp: string
  createdAt: string
}

interface Form {
  _id: string
  title: string
  description?: string
  slug: string
  fields: Array<{
    id: string
    type: string
    label: string
    options?: string[]
  }>
}

export default function FormResponses() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  
  const [form, setForm] = useState<Form | null>(null)
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    fetchFormAndResponses()
  }, [session, status, router, slug])

  const fetchFormAndResponses = async () => {
    try {
      // Fetch form details
      const formResponse = await fetch(`/api/forms/${slug}/details`)
      if (formResponse.ok) {
        const formData = await formResponse.json()
        setForm(formData.form)
      }

      // Fetch responses
      const responsesResponse = await fetch(`/api/forms/${slug}/responses`)
      if (responsesResponse.ok) {
        const responsesData = await responsesResponse.json()
        setResponses(responsesData.responses)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!form || responses.length === 0) return

    // Create CSV headers
    const headers = ['Submission Date', 'IP Address', ...form.fields.map(field => field.label)]
    
    // Create CSV rows
    const rows = responses.map(response => {
      const row = [
        formatDate(new Date(response.createdAt)),
        response.submitterIp
      ]
      
      // Add field values
      form.fields.forEach(field => {
        const fieldResponse = response.responses.find(r => r.fieldId === field.id)
        let value = fieldResponse?.value || ''
        
        // Handle arrays (multiple choice)
        if (Array.isArray(value)) {
          value = value.join(', ')
        }
        
        row.push(value.toString())
      })
      
      return row
    })

    // Create CSV content
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.title}-responses.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || !form) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
                <p className="text-gray-600">Form Responses ({responses.length})</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV} disabled={responses.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/form/${slug}`} target="_blank">
                  <Eye className="w-4 h-4 mr-2" />
                  View Form
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {responses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
                <p className="text-gray-600 mb-4">
                  Share your form to start collecting responses
                </p>
                <Button asChild>
                  <Link href={`/form/${slug}`} target="_blank">
                    View Form
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Summary</CardTitle>
                <CardDescription>
                  Overview of form submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{responses.length}</div>
                    <div className="text-sm text-gray-600">Total Responses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {new Set(responses.map(r => r.submitterIp)).size}
                    </div>
                    <div className="text-sm text-gray-600">Unique IPs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {responses.length > 0 ? formatDate(new Date(responses[0].createdAt)) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Latest Response</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Responses</CardTitle>
                <CardDescription>
                  Individual form submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Date</th>
                        <th className="text-left p-2 font-medium">IP</th>
                        {form.fields.map(field => (
                          <th key={field.id} className="text-left p-2 font-medium">
                            {field.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {responses.map((response, index) => (
                        <tr key={response._id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="p-2 text-sm">
                            {formatDate(new Date(response.createdAt))}
                          </td>
                          <td className="p-2 text-sm font-mono">
                            {response.submitterIp}
                          </td>
                          {form.fields.map(field => {
                            const fieldResponse = response.responses.find(r => r.fieldId === field.id)
                            let value = fieldResponse?.value || '-'
                            
                            if (Array.isArray(value)) {
                              value = value.join(', ')
                            }
                            
                            if (field.type === 'rating') {
                              value = `${value}/5 ⭐`
                            }
                            
                            return (
                              <td key={field.id} className="p-2 text-sm max-w-xs truncate">
                                {value.toString()}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}