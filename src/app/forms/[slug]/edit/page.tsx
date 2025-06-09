'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, GripVertical, Settings, Badge } from 'lucide-react';

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  order: number;
  options?: string[];
  allowMultiple?: boolean;
  maxRating?: number;
  placeholder?: string;
}

interface FormData {
  id: string;
  title: string;
  description: string;
  slug: string;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'multiple-choice', label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'rating', label: 'Rating' },
  { value: 'date', label: 'Date' },
];

export default function EditForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [formData, setFormData] = useState<FormData | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchFormData();
  }, [session, status, router, slug]);

  const fetchFormData = async () => {
    try {
      const response = await fetch(`/api/forms/${slug}`);
      const data = await response.json();

      if (response.ok) {
        setFormData(data.form);
        setTitle(data.form.title);
        setDescription(data.form.description || "");
        setFields(
          data.form.fields.sort(
            (a: FormField, b: FormField) => a.order - b.order
          )
        );
      } else {
        toast.error(data.error || "Failed to fetch form data");
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("An error occurred while fetching form data");
      router.push("/dashboard");
      console.error(error)
    } finally {
      setIsLoading(false);
    }
  };

  const addField = (type: string) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: `${type
        .replace("-", " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())} Field`,
      required: false,
      order: fields.length,
      ...(type === "multiple-choice" && {
        options: ["Option 1", "Option 2"],
        allowMultiple: false,
      }),
      ...(type === "rating" && {
        maxRating: 5,
      }),
    };
    setFields([...fields, newField]);
    setEditingField(newField.id);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const removeField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
    if (editingField === id) {
      setEditingField(null);
    }
  };

  const moveField = (id: string, direction: "up" | "down") => {
    const currentIndex = fields.findIndex((field) => field.id === id);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === fields.length - 1)
    ) {
      return;
    }

    const newFields = [...fields];
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    [newFields[currentIndex], newFields[targetIndex]] = [
      newFields[targetIndex],
      newFields[currentIndex],
    ];

    // Update order
    newFields.forEach((field, index) => {
      field.order = index;
    });

    setFields(newFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Form title is required");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/forms/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          fields: fields.map((field, index) => ({
            ...field,
            order: index,
          })),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Form updated successfully");
        setFormData(data.form);
      } else {
        toast.error(data.error || "Failed to update form");
      }
    } catch (error) {
      toast.error("An error occurred while updating the form");
      console.error(error)
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteForm = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this form? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/forms/${slug}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Form deleted successfully");
        router.push("/dashboard");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete form");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the form");
      console.error(error)
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Form not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Edit Form</h1>
          <p className="text-gray-600 mt-2">
            Modify your form structure and content
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
          <Button variant="destructive" onClick={handleDeleteForm}>
            Delete Form
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Form Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Form Details</CardTitle>
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
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-2"
              >
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter form description (optional)"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Form Fields
              <div className="flex gap-2">
                {FIELD_TYPES.map((fieldType) => (
                  <Button
                    key={fieldType.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addField(fieldType.value)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {fieldType.label}
                  </Button>
                ))}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No fields added yet. Click on a field type above to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <Badge variant="secondary">{field.type}</Badge>
                        <span className="font-medium">{field.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveField(field.id, "up")}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveField(field.id, "down")}
                          disabled={index === fields.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setEditingField(
                              editingField === field.id ? null : field.id
                            )
                          }
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(field.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {editingField === field.id && (
                      <div className="space-y-3 pt-3 border-t">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Field Label
                          </label>
                          <Input
                            value={field.label}
                            onChange={(e) =>
                              updateField(field.id, { label: e.target.value })
                            }
                            placeholder="Enter field label"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`required-${field.id}`}
                            checked={field.required}
                            onChange={(e) =>
                              updateField(field.id, {
                                required: e.target.checked,
                              })
                            }
                          />
                          <label
                            htmlFor={`required-${field.id}`}
                            className="text-sm"
                          >
                            Required field
                          </label>
                        </div>

                        {field.type === "multiple-choice" && (
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Options
                            </label>
                            {field.options?.map((option, optionIndex) => (
                              <div
                                key={optionIndex}
                                className="flex items-center gap-2 mb-2"
                              >
                                <Input
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [
                                      ...(field.options || []),
                                    ];
                                    newOptions[optionIndex] = e.target.value;
                                    updateField(field.id, {
                                      options: newOptions,
                                    });
                                  }}
                                  placeholder={`Option ${optionIndex + 1}`}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newOptions = field.options?.filter(
                                      (_, i) => i !== optionIndex
                                    );
                                    updateField(field.id, {
                                      options: newOptions,
                                    });
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
                                const newOptions = [
                                  ...(field.options || []),
                                  `Option ${(field.options?.length || 0) + 1}`,
                                ];
                                updateField(field.id, { options: newOptions });
                              }}
                            >
                              Add Option
                            </Button>
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="checkbox"
                                id={`multiple-${field.id}`}
                                checked={field.allowMultiple || false}
                                onChange={(e) =>
                                  updateField(field.id, {
                                    allowMultiple: e.target.checked,
                                  })
                                }
                              />
                              <label
                                htmlFor={`multiple-${field.id}`}
                                className="text-sm"
                              >
                                Allow multiple selections
                              </label>
                            </div>
                          </div>
                        )}

                        {field.type === "rating" && (
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Maximum Rating
                            </label>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={field.maxRating || 5}
                              onChange={(e) =>
                                updateField(field.id, {
                                  maxRating: parseInt(e.target.value),
                                })
                              }
                            />
                          </div>
                        )}

                        {(field.type === "text" ||
                          field.type === "textarea" ||
                          field.type === "email") && (
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Placeholder Text
                            </label>
                            <Input
                              value={field.placeholder || ""}
                              onChange={(e) =>
                                updateField(field.id, {
                                  placeholder: e.target.value,
                                })
                              }
                              placeholder="Enter placeholder text"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Field Preview */}
                    <div className="mt-3 p-3 bg-white rounded border">
                      <div className="text-sm text-gray-600 mb-1">Preview:</div>
                      <FieldPreview field={field} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/forms/${slug}`)}
          >
            Preview Form
          </Button>
          <Button type="submit" disabled={isSaving} className="min-w-[120px]">
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Field Preview Component
function FieldPreview({ field }: { field: FormField }) {
  const renderField = () => {
    switch (field.type) {
      case "text":
      case "email":
        return (
          <Input
            placeholder={
              field.placeholder || `Enter ${field.label.toLowerCase()}`
            }
            disabled
            className="opacity-60"
          />
        );

      case "textarea":
        return (
          <Textarea
            placeholder={
              field.placeholder || `Enter ${field.label.toLowerCase()}`
            }
            disabled
            className="opacity-60"
            rows={3}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            placeholder="Enter number"
            disabled
            className="opacity-60"
          />
        );

      case "date":
        return <Input type="date" disabled className="opacity-60" />;

      case "multiple-choice":
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type={field.allowMultiple ? "checkbox" : "radio"}
                  name={`preview-${field.id}`}
                  disabled
                  className="opacity-60"
                />
                <span className="text-sm opacity-60">{option}</span>
              </div>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <input type="checkbox" disabled className="opacity-60" />
            <span className="text-sm opacity-60">Check this option</span>
          </div>
        );

      case "rating":
        return (
          <div className="flex gap-1">
            {Array.from({ length: field.maxRating || 5 }, (_, i) => (
              <span key={i} className="text-gray-300 text-xl">
                ★
              </span>
            ))}
          </div>
        );

      default:
        return <div className="text-gray-400 text-sm">Unknown field type</div>;
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderField()}
    </div>
  );
}