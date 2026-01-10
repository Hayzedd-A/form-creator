"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Trash2,
  Plus,
  GripVertical,
  Settings,
  Eye,
  Copy,
  Palette,
  Bell,
  Shield,
  Calendar,
  BarChart3,
  Save,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Upload,
} from "lucide-react";
import { PREDEFINED_CATEGORIES, PREDEFINED_OPTIONS } from "@/lib/datas";
import ImportOptionsDialog from "@/components/ImportOptionDialog";

interface FormField {
  id: string;
  type:
    | "short-text"
    | "paragraph"
    | "multiple-choice"
    | "file-upload"
    | "rating"
    | "date"
    | "time"
    | "datetime"
    | "email"
    | "number"
    | "phone"
    | "url"
    | "checkbox"
    | "dropdown"
    | "linear-scale"
    | "yes-no"
    | "signature"
    | "address";
  label: string;
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: string[];
  allowMultiple?: boolean;
  allowOther?: boolean;
  maxRating?: number;
  minScale?: number;
  maxScale?: number;
  scaleLabels?: { min?: string; max?: string };
  minValue?: number;
  maxValue?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minDate?: string;
  maxDate?: string;
  dateFormat?: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  allowedFileTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  order: number;
  width?: "full" | "half";
  correctAnswer?: any;
  explanation?: string;
}

interface FormData {
  id: string;
  title: string;
  description: string;
  slug: string;
  fields: FormField[];
  settings: {
    isPublic: boolean;
    allowedEmails: string[];
    limitOneResponse: boolean;
    limitByEmail: boolean;
    limitByIP: boolean;
    openDate?: string;
    closeDate?: string;
    assignmentMode: boolean;
    requireLogin: boolean;
    allowAnonymous: boolean;
    collectEmail: boolean;
    collectIP: boolean;
    showProgressBar: boolean;
    allowSaveDraft: boolean;
    customTheme: {
      primaryColor?: string;
      backgroundColor?: string;
      textColor?: string;
      fontFamily?: string;
    };
    notifications: {
      emailOnSubmission: boolean;
      notificationEmails: string[];
    };
    redirectUrl?: string;
    customSuccessMessage?: string;
  };
  analytics: {
    views: number;
    submissions: number;
    lastSubmission?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const FIELD_TYPES = [
  { value: "short-text", label: "Short Text", icon: "📝" },
  { value: "paragraph", label: "Paragraph", icon: "📄" },
  { value: "email", label: "Email", icon: "📧" },
  { value: "number", label: "Number", icon: "🔢" },
  { value: "phone", label: "Phone", icon: "📞" },
  { value: "url", label: "URL", icon: "🔗" },
  { value: "date", label: "Date", icon: "📅" },
  { value: "time", label: "Time", icon: "⏰" },
  { value: "datetime", label: "Date & Time", icon: "📆" },
  { value: "multiple-choice", label: "Multiple Choice", icon: "🔘" },
  { value: "checkbox", label: "Checkboxes", icon: "☑️" },
  { value: "dropdown", label: "Dropdown", icon: "📋" },
  { value: "yes-no", label: "Yes/No", icon: "✅" },
  { value: "rating", label: "Rating", icon: "⭐" },
  { value: "linear-scale", label: "Linear Scale", icon: "📊" },
  { value: "file-upload", label: "File Upload", icon: "📎" },
  { value: "signature", label: "Signature", icon: "✍️" },
  { value: "address", label: "Address", icon: "📍" },
];

const FONT_FAMILIES = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Poppins", label: "Poppins" },
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
  const [settings, setSettings] = useState<FormData["settings"]>({
    isPublic: true,
    allowedEmails: [],
    limitOneResponse: false,
    limitByEmail: false,
    limitByIP: false,
    assignmentMode: false,
    requireLogin: false,
    allowAnonymous: true,
    collectEmail: false,
    collectIP: true,
    showProgressBar: false,
    allowSaveDraft: false,
    customTheme: {},
    notifications: {
      emailOnSubmission: false,
      notificationEmails: [],
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("fields");
  const [newNotificationEmail, setNewNotificationEmail] = useState("");

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
        setSettings(data.form.settings || settings);
      } else {
        toast.error(data.error || "Failed to fetch form data");
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("An error occurred while fetching form data");
      router.push("/dashboard");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const addField = (type: string) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: type as FormField["type"],
      label: `${type
        .replace("-", " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())} Field`,
      required: false,
      order: fields.length,
      width: "full",
      ...(type === "multiple-choice" && {
        options: ["Option 1", "Option 2"],
        allowMultiple: false,
        allowOther: false,
      }),
      ...(type === "checkbox" && {
        options: ["Option 1", "Option 2"],
      }),
      ...(type === "dropdown" && {
        options: ["Option 1", "Option 2"],
      }),
      ...(type === "rating" && {
        maxRating: 5,
      }),
      ...(type === "linear-scale" && {
        minScale: 1,
        maxScale: 10,
        scaleLabels: { min: "Strongly Disagree", max: "Strongly Agree" },
      }),
      ...(type === "file-upload" && {
        allowedFileTypes: ["image/*"],
        maxFileSize: 10,
        maxFiles: 1,
      }),
      ...(type === "number" && {
        step: 1,
      }),
      ...(type === "date" && {
        dateFormat: "MM/DD/YYYY" as const,
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

  const duplicateField = (id: string) => {
    const fieldToDuplicate = fields.find((field) => field.id === id);
    if (fieldToDuplicate) {
      const newField = {
        ...fieldToDuplicate,
        id: `field-${Date.now()}`,
        label: `${fieldToDuplicate.label} (Copy)`,
        order: fields.length,
      };
      setFields([...fields, newField]);
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

  const updateSettings = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateTheme = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      customTheme: {
        ...prev.customTheme,
        [key]: value,
      },
    }));
  };

  const addNotificationEmail = () => {
    if (
      newNotificationEmail &&
      !settings.notifications.notificationEmails.includes(newNotificationEmail)
    ) {
      setSettings((prev) => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          notificationEmails: [
            ...prev.notifications.notificationEmails,
            newNotificationEmail,
          ],
        },
      }));
      setNewNotificationEmail("");
    }
  };

  const removeNotificationEmail = (email: string) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        notificationEmails: prev.notifications.notificationEmails.filter(
          (e) => e !== email
        ),
      },
    }));
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
          settings,
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
      console.error(error);
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
      console.error(error);
    }
  };

  const copyFormUrl = () => {
    const url = `${window.location.origin}/form/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Form URL copied to clipboard!");
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">{title || "Edit Form"}</h1>
          <p className="text-gray-600 mt-2">
            Modify your form structure, settings, and appearance
          </p>
          {formData.analytics && (
            <div className="flex gap-4 mt-3 text-sm text-gray-500">
              <span>👁️ {formData.analytics.views} views</span>
              <span>📝 {formData.analytics.submissions} submissions</span>
              {formData.analytics.lastSubmission && (
                <span>
                  Last:{" "}
                  {new Date(
                    formData.analytics.lastSubmission
                  ).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyFormUrl}>
            <Copy className="w-4 h-4 mr-2" />
            Copy URL
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(`/form/${slug}`, "_blank")}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
          <Button variant="destructive" onClick={handleDeleteForm}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="fields" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Fields
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="design" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Design
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Form Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Form Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter form title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Form URL</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      /form/
                    </span>
                    <Input
                      id="slug"
                      value={slug}
                      disabled
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
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

          {/* Fields Tab */}
          <TabsContent value="fields" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Form Fields</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    {FIELD_TYPES.map((fieldType) => (
                      <Button
                        key={fieldType.value}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addField(fieldType.value)}
                        className="text-xs"
                      >
                        <span className="mr-1">{fieldType.icon}</span>
                        {fieldType.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">
                      No fields added yet
                    </h3>
                    <p>
                      Click on a field type above to get started building your
                      form.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <FieldEditor
                        key={field.id}
                        field={field}
                        index={index}
                        isEditing={editingField === field.id}
                        onEdit={() =>
                          setEditingField(
                            editingField === field.id ? null : field.id
                          )
                        }
                        onUpdate={(updates) => updateField(field.id, updates)}
                        onRemove={() => removeField(field.id)}
                        onDuplicate={() => duplicateField(field.id)}
                        onMove={(direction) => moveField(field.id, direction)}
                        canMoveUp={index > 0}
                        canMoveDown={index < fields.length - 1}
                        assignmentMode={settings.assignmentMode}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Access Control */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Access Control
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Public Form</Label>
                      <p className="text-sm text-gray-500">
                        Anyone with the link can access
                      </p>
                    </div>
                    <Switch
                      checked={settings.isPublic}
                      onCheckedChange={(checked) =>
                        updateSettings("isPublic", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Login</Label>
                      <p className="text-sm text-gray-500">
                        Users must be signed in
                      </p>
                    </div>
                    <Switch
                      checked={settings.requireLogin}
                      onCheckedChange={(checked) =>
                        updateSettings("requireLogin", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Collect Email</Label>
                      <p className="text-sm text-gray-500">
                        Require email before form access
                      </p>
                    </div>
                    <Switch
                      checked={settings.collectEmail}
                      onCheckedChange={(checked) =>
                        updateSettings("collectEmail", checked)
                      }
                    />
                  </div>

                  <div>
                    <Label>Allowed Emails</Label>
                    <p className="text-sm text-gray-500 mb-2">
                      Restrict access to specific emails (one per line)
                    </p>
                    <Textarea
                      value={settings.allowedEmails.join("\n")}
                      onChange={(e) =>
                        updateSettings(
                          "allowedEmails",
                          e.target.value
                            .split("\n")
                            .map((email) => email.trim())
                            .filter(
                              (email, index, arr) =>
                                // Keep empty lines during editing for better UX
                                email !== "" || index === arr.length - 1
                            )
                        )
                      }
                      onKeyDown={(e) => {
                        // Ensure Enter key works for new lines
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          // Don't prevent default - let textarea handle it naturally
                        }
                      }}
                      placeholder="user@example.com&#10;admin@example.com&#10;team@example.com"
                      rows={5}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Response Limits */}
              <Card>
                <CardHeader>
                  <CardTitle>Response Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>One Response Per User</Label>
                      <p className="text-sm text-gray-500">
                        Limit to one submission per IP
                      </p>
                    </div>
                    <Switch
                      checked={settings.limitOneResponse}
                      onCheckedChange={(checked) =>
                        updateSettings("limitOneResponse", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Limit by Email</Label>
                      <p className="text-sm text-gray-500">
                        One submission per email address
                      </p>
                    </div>
                    <Switch
                      checked={settings.limitByEmail}
                      onCheckedChange={(checked) =>
                        updateSettings("limitByEmail", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Limit by IP Address</Label>
                      <p className="text-sm text-gray-500">
                        One submission per IP address
                      </p>
                    </div>
                    <Switch
                      checked={settings.limitByIP}
                      onCheckedChange={(checked) =>
                        updateSettings("limitByIP", checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="openDate">Open Date</Label>
                    <Input
                      id="openDate"
                      type="datetime-local"
                      value={
                        settings.openDate
                          ? new Date(settings.openDate)
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        updateSettings(
                          "openDate",
                          e.target.value
                            ? new Date(e.target.value).toISOString()
                            : ""
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="closeDate">Close Date</Label>
                    <Input
                      id="closeDate"
                      type="datetime-local"
                      value={
                        settings.closeDate
                          ? new Date(settings.closeDate)
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        updateSettings(
                          "closeDate",
                          e.target.value
                            ? new Date(e.target.value).toISOString()
                            : ""
                        )
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Assignment Mode */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Assignment Mode
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Assignment Mode</Label>
                      <p className="text-sm text-gray-500">
                        Show results and grades after submission
                      </p>
                    </div>
                    <Switch
                      checked={settings.assignmentMode}
                      onCheckedChange={(checked) =>
                        updateSettings("assignmentMode", checked)
                      }
                    />
                  </div>

                  {settings.assignmentMode && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <HelpCircle className="w-4 h-4 inline mr-1" />
                        In assignment mode, you can set correct answers and
                        explanations for each field. Users will see their
                        results after submission.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User Experience */}
              <Card>
                <CardHeader>
                  <CardTitle>User Experience</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Progress Bar</Label>
                      <p className="text-sm text-gray-500">
                        Display completion progress
                      </p>
                    </div>
                    <Switch
                      checked={settings.showProgressBar}
                      onCheckedChange={(checked) =>
                        updateSettings("showProgressBar", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Save Draft</Label>
                      <p className="text-sm text-gray-500">
                        Users can save and resume later
                      </p>
                    </div>
                    <Switch
                      checked={settings.allowSaveDraft}
                      onCheckedChange={(checked) =>
                        updateSettings("allowSaveDraft", checked)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="redirectUrl">Redirect URL</Label>
                    <Input
                      id="redirectUrl"
                      value={settings.redirectUrl || ""}
                      onChange={(e) =>
                        updateSettings("redirectUrl", e.target.value)
                      }
                      placeholder="https://example.com/thank-you"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Redirect users after successful submission
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="successMessage">
                      Custom Success Message
                    </Label>
                    <Textarea
                      id="successMessage"
                      value={settings.customSuccessMessage || ""}
                      onChange={(e) =>
                        updateSettings("customSuccessMessage", e.target.value)
                      }
                      placeholder="Thank you for your submission!"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Design Tab */}
          <TabsContent value="design" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Custom Theme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={
                            settings?.customTheme?.primaryColor || "#3b82f6"
                          }
                          onChange={(e) =>
                            updateTheme("primaryColor", e.target.value)
                          }
                          className="w-16 h-10"
                        />
                        <Input
                          value={
                            settings?.customTheme?.primaryColor || "#3b82f6"
                          }
                          onChange={(e) =>
                            updateTheme("primaryColor", e.target.value)
                          }
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="backgroundColor">Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="backgroundColor"
                          type="color"
                          value={
                            settings?.customTheme?.backgroundColor || "#ffffff"
                          }
                          onChange={(e) =>
                            updateTheme("backgroundColor", e.target.value)
                          }
                          className="w-16 h-10"
                        />
                        <Input
                          value={
                            settings?.customTheme?.backgroundColor || "#ffffff"
                          }
                          onChange={(e) =>
                            updateTheme("backgroundColor", e.target.value)
                          }
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="textColor">Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="textColor"
                          type="color"
                          value={settings?.customTheme?.textColor || "#1f2937"}
                          onChange={(e) =>
                            updateTheme("textColor", e.target.value)
                          }
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings?.customTheme?.textColor || "#1f2937"}
                          onChange={(e) =>
                            updateTheme("textColor", e.target.value)
                          }
                          placeholder="#1f2937"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="fontFamily">Font Family</Label>
                      <Select
                        value={settings?.customTheme?.fontFamily || "Inter"}
                        onValueChange={(value) =>
                          updateTheme("fontFamily", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_FAMILIES.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Theme Preview */}
                  <div className="space-y-4">
                    <Label>Preview</Label>
                    <div
                      className="p-6 rounded-lg border-2"
                      style={{
                        backgroundColor:
                          settings.customTheme?.backgroundColor || "#ffffff",
                        color: settings.customTheme?.textColor || "#1f2937",
                        fontFamily: settings.customTheme?.fontFamily || "Inter",
                      }}
                    >
                      <h3 className="text-xl font-bold mb-2">
                        {title || "Form Title"}
                      </h3>
                      <p className="mb-4 opacity-75">
                        {description || "Form description goes here..."}
                      </p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Sample Field
                          </label>
                          <div className="w-full px-3 py-2 border rounded-md bg-white">
                            Sample input field
                          </div>
                        </div>
                        <button
                          className="px-4 py-2 rounded-md text-white font-medium"
                          style={{
                            backgroundColor:
                              settings.customTheme?.primaryColor || "#3b82f6",
                          }}
                        >
                          Submit Button
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Email Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email on Submission</Label>
                    <p className="text-sm text-gray-500">
                      Send email when form is submitted
                    </p>
                  </div>
                  <Switch
                    checked={settings?.notifications?.emailOnSubmission}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          emailOnSubmission: checked,
                        },
                      }))
                    }
                  />
                </div>

                {settings?.notifications?.emailOnSubmission && (
                  <div className="space-y-3">
                    <Label>Notification Recipients</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newNotificationEmail}
                        onChange={(e) =>
                          setNewNotificationEmail(e.target.value)
                        }
                        placeholder="email@example.com"
                        type="email"
                      />
                      <Button type="button" onClick={addNotificationEmail}>
                        Add
                      </Button>
                    </div>

                    {settings?.notifications?.notificationEmails.length > 0 && (
                      <div className="space-y-2">
                        {settings.notifications.notificationEmails.map(
                          (email, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <span className="text-sm">{email}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeNotificationEmail(email)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Views
                      </p>
                      <p className="text-2xl font-bold">
                        {formData.analytics?.views || 0}
                      </p>
                    </div>
                    <Eye className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Submissions
                      </p>
                      <p className="text-2xl font-bold">
                        {formData.analytics?.submissions || 0}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Conversion Rate
                      </p>
                      <p className="text-2xl font-bold">
                        {formData.analytics?.views > 0
                          ? Math.round(
                              ((formData.analytics?.submissions || 0) /
                                formData.analytics.views) *
                                100
                            )
                          : 0}
                        %
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Form URLs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Public Form URL</p>
                    <p className="text-sm text-gray-600">
                      {window.location.origin}/form/{slug}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={copyFormUrl}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Responses Dashboard</p>
                    <p className="text-sm text-gray-600">
                      {window.location.origin}/forms/{slug}/responses
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/forms/${slug}/responses`)}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button type="submit" disabled={isSaving} className="min-w-[120px]">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Field Editor Component
interface FieldEditorProps {
  field: FormField;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (updates: Partial<FormField>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMove: (direction: "up" | "down") => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  assignmentMode: boolean;
}

function FieldEditor({
  field,
  index,
  isEditing,
  onEdit,
  onUpdate,
  onRemove,
  onDuplicate,
  onMove,
  canMoveUp,
  canMoveDown,
  assignmentMode,
}: FieldEditorProps) {
  const fieldType = FIELD_TYPES.find((t) => t.value === field.type);

  return (
    <div className="border rounded-lg bg-white">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
            <Badge variant="secondary" className="text-xs">
              {fieldType?.icon} {fieldType?.label}
            </Badge>
            {/* <span className="font-medium">{field.label}</span> */}
            {field.required && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onMove("up")}
              disabled={!canMoveUp}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onMove("down")}
              disabled={!canMoveDown}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>

        {/* Field Preview */}
        <div className="p-3 bg-gray-50 rounded border">
          <FieldPreview field={field} />
        </div>

        {/* Field Editor */}
        {isEditing && (
          <div className="mt-4 p-4 border-t space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Field Label</Label>
                <Input
                  value={field.label}
                  onChange={(e) => onUpdate({ label: e.target.value })}
                  placeholder="Enter field label"
                />
              </div>

              <div>
                <Label>Field Width</Label>
                <Select
                  value={field.width || "full"}
                  onValueChange={(value: "full" | "half") =>
                    onUpdate({ width: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Width</SelectItem>
                    <SelectItem value="half">Half Width</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description (Optional)</Label>
              <Input
                value={field.description || ""}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Help text for this field"
              />
            </div>

            {/* Field-specific options */}
            <FieldSpecificOptions
              field={field}
              onUpdate={onUpdate}
              assignmentMode={assignmentMode}
            />

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`required-${field.id}`}
                  checked={field.required}
                  onChange={(e) => onUpdate({ required: e.target.checked })}
                />
                <Label htmlFor={`required-${field.id}`}>Required field</Label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Field-specific options component
interface FieldSpecificOptionsProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  assignmentMode: boolean;
}

function FieldSpecificOptions({
  field,
  onUpdate,
  assignmentMode,
}: FieldSpecificOptionsProps) {
  const addOption = () => {
    const newOptions = [
      ...(field.options || []),
      `Option ${(field.options?.length || 0) + 1}`,
    ];
    onUpdate({ options: newOptions });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(field.options || [])];
    newOptions[index] = value;
    onUpdate({ options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = field.options?.filter((_, i) => i !== index);
    onUpdate({ options: newOptions });
  };

  switch (field.type) {
    case "short-text":
    case "paragraph":
    case "email":
    case "url":
      return (
        <div className="space-y-4">
          <div>
            <Label>Placeholder Text</Label>
            <Input
              value={field.placeholder || ""}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              placeholder="Enter placeholder text"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Minimum Length</Label>
              <Input
                type="number"
                value={field.minLength || ""}
                onChange={(e) =>
                  onUpdate({ minLength: parseInt(e.target.value) || undefined })
                }
                placeholder="0"
              />
            </div>
            <div>
              <Label>Maximum Length</Label>
              <Input
                type="number"
                value={field.maxLength || ""}
                onChange={(e) =>
                  onUpdate({ maxLength: parseInt(e.target.value) || undefined })
                }
                placeholder="No limit"
              />
            </div>
          </div>

          {assignmentMode && (
            <div className="p-4 bg-blue-50 rounded-lg space-y-3">
              <h4 className="font-medium text-blue-900">Assignment Settings</h4>
              <div>
                <Label>Correct Answer</Label>
                <Input
                  value={field.correctAnswer || ""}
                  onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
                  placeholder="Enter the correct answer"
                />
              </div>
              <div>
                <Label>Explanation</Label>
                <Textarea
                  value={field.explanation || ""}
                  onChange={(e) => onUpdate({ explanation: e.target.value })}
                  placeholder="Explain why this is the correct answer"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>
      );

    case "number":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Minimum Value</Label>
              <Input
                type="number"
                value={field.minValue || ""}
                onChange={(e) =>
                  onUpdate({
                    minValue: parseFloat(e.target.value) || undefined,
                  })
                }
                placeholder="No minimum"
              />
            </div>
            <div>
              <Label>Maximum Value</Label>
              <Input
                type="number"
                value={field.maxValue || ""}
                onChange={(e) =>
                  onUpdate({
                    maxValue: parseFloat(e.target.value) || undefined,
                  })
                }
                placeholder="No maximum"
              />
            </div>
            <div>
              <Label>Step</Label>
              <Input
                type="number"
                value={field.step || 1}
                onChange={(e) =>
                  onUpdate({ step: parseFloat(e.target.value) || 1 })
                }
                placeholder="1"
              />
            </div>
          </div>

          {assignmentMode && (
            <div className="p-4 bg-blue-50 rounded-lg space-y-3">
              <h4 className="font-medium text-blue-900">Assignment Settings</h4>
              <div>
                <Label>Correct Answer</Label>
                <Input
                  type="number"
                  value={field.correctAnswer || ""}
                  onChange={(e) =>
                    onUpdate({
                      correctAnswer: parseFloat(e.target.value) || undefined,
                    })
                  }
                  placeholder="Enter the correct number"
                />
              </div>
              <div>
                <Label>Explanation</Label>
                <Textarea
                  value={field.explanation || ""}
                  onChange={(e) => onUpdate({ explanation: e.target.value })}
                  placeholder="Explain the correct answer"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>
      );

    case "date":
    case "datetime":
      return (
        <div className="space-y-4">
          <div>
            <Label>Date Format</Label>
            <Select
              value={field.dateFormat || "MM/DD/YYYY"}
              onValueChange={(
                value: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD"
              ) => onUpdate({ dateFormat: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Minimum Date</Label>
              <Input
                type="date"
                value={field.minDate || ""}
                onChange={(e) => onUpdate({ minDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Maximum Date</Label>
              <Input
                type="date"
                value={field.maxDate || ""}
                onChange={(e) => onUpdate({ maxDate: e.target.value })}
              />
            </div>
          </div>
        </div>
      );
    // Update the multiple-choice, checkbox, dropdown case in FieldSpecificOptions
    // Update the multiple-choice, checkbox, dropdown case in FieldSpecificOptions
    case "multiple-choice":
    case "checkbox":
    case "dropdown":
      return (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Options</Label>
              <div className="flex gap-2">
                <Select
                  onValueChange={(value) => {
                    if (
                      value &&
                      PREDEFINED_OPTIONS[
                        value as keyof typeof PREDEFINED_OPTIONS
                      ]
                    ) {
                      const predefinedOptions =
                        PREDEFINED_OPTIONS[
                          value as keyof typeof PREDEFINED_OPTIONS
                        ];
                      onUpdate({ options: predefinedOptions });
                    }
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Load predefined options" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_CATEGORIES.map((category) => (
                      <div key={category.label}>
                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                          {category.label}
                        </div>
                        {category.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>

                <ImportOptionsDialog
                  onImport={(importedOptions) =>
                    onUpdate({ options: importedOptions })
                  }
                  trigger={
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Import
                    </Button>
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                    disabled={(field.options?.length || 0) <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdate({ options: [] })}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </div>
          {/* Rest of the existing code for this case */}
          {field.type === "multiple-choice" && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`multiple-${field.id}`}
                checked={field.allowMultiple || false}
                onChange={(e) => onUpdate({ allowMultiple: e.target.checked })}
              />
              <Label htmlFor={`multiple-${field.id}`}>
                Allow multiple selections
              </Label>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`other-${field.id}`}
              checked={field.allowOther || false}
              onChange={(e) => onUpdate({ allowOther: e.target.checked })}
            />
            <Label htmlFor={`other-${field.id}`}>Allow "Other" option</Label>
          </div>

          {assignmentMode && (
            <div className="p-4 bg-blue-50 rounded-lg space-y-3">
              <h4 className="font-medium text-blue-900">Assignment Settings</h4>
              <div>
                <Label>Correct Answer(s)</Label>
                <div className="space-y-2">
                  {field.options?.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type={field.allowMultiple ? "checkbox" : "radio"}
                        name={`correct-${field.id}`}
                        checked={
                          field.allowMultiple
                            ? (field.correctAnswer || []).includes(option)
                            : field.correctAnswer === option
                        }
                        onChange={(e) => {
                          if (field.allowMultiple) {
                            const current = field.correctAnswer || [];
                            if (e.target.checked) {
                              onUpdate({ correctAnswer: [...current, option] });
                            } else {
                              onUpdate({
                                correctAnswer: current.filter(
                                  (item: string) => item !== option
                                ),
                              });
                            }
                          } else {
                            onUpdate({ correctAnswer: option });
                          }
                        }}
                      />
                      <span className="text-sm">{option}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Explanation</Label>
                <Textarea
                  value={field.explanation || ""}
                  onChange={(e) => onUpdate({ explanation: e.target.value })}
                  placeholder="Explain the correct answer"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>
      );

    case "rating":
      return (
        <div className="space-y-4">
          <div>
            <Label>Maximum Rating</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={field.maxRating || 5}
              onChange={(e) =>
                onUpdate({ maxRating: parseInt(e.target.value) || 5 })
              }
            />
          </div>

          {assignmentMode && (
            <div className="p-4 bg-blue-50 rounded-lg space-y-3">
              <h4 className="font-medium text-blue-900">Assignment Settings</h4>
              <div>
                <Label>Correct Rating</Label>
                <Input
                  type="number"
                  min="1"
                  max={field.maxRating || 5}
                  value={field.correctAnswer || ""}
                  onChange={(e) =>
                    onUpdate({
                      correctAnswer: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder="Enter the correct rating"
                />
              </div>
              <div>
                <Label>Explanation</Label>
                <Textarea
                  value={field.explanation || ""}
                  onChange={(e) => onUpdate({ explanation: e.target.value })}
                  placeholder="Explain the correct rating"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>
      );

    case "linear-scale":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Minimum Scale</Label>
              <Input
                type="number"
                value={field.minScale || 1}
                onChange={(e) =>
                  onUpdate({ minScale: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div>
              <Label>Maximum Scale</Label>
              <Input
                type="number"
                value={field.maxScale || 10}
                onChange={(e) =>
                  onUpdate({ maxScale: parseInt(e.target.value) || 10 })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Minimum Label</Label>
              <Input
                value={field.scaleLabels?.min || ""}
                onChange={(e) =>
                  onUpdate({
                    scaleLabels: { ...field.scaleLabels, min: e.target.value },
                  })
                }
                placeholder="e.g., Strongly Disagree"
              />
            </div>
            <div>
              <Label>Maximum Label</Label>
              <Input
                value={field.scaleLabels?.max || ""}
                onChange={(e) =>
                  onUpdate({
                    scaleLabels: { ...field.scaleLabels, max: e.target.value },
                  })
                }
                placeholder="e.g., Strongly Agree"
              />
            </div>
          </div>

          {assignmentMode && (
            <div className="p-4 bg-blue-50 rounded-lg space-y-3">
              <h4 className="font-medium text-blue-900">Assignment Settings</h4>
              <div>
                <Label>Correct Scale Value</Label>
                <Input
                  type="number"
                  min={field.minScale || 1}
                  max={field.maxScale || 10}
                  value={field.correctAnswer || ""}
                  onChange={(e) =>
                    onUpdate({
                      correctAnswer: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder="Enter the correct scale value"
                />
              </div>
              <div>
                <Label>Explanation</Label>
                <Textarea
                  value={field.explanation || ""}
                  onChange={(e) => onUpdate({ explanation: e.target.value })}
                  placeholder="Explain the correct scale value"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>
      );

    case "file-upload":
      return (
        <div className="space-y-4">
          <div>
            <Label>Allowed File Types</Label>
            <Input
              value={field.allowedFileTypes?.join(", ") || "image/*"}
              onChange={(e) =>
                onUpdate({
                  allowedFileTypes: e.target.value
                    .split(",")
                    .map((type) => type.trim()),
                })
              }
              placeholder="image/*, .pdf, .doc"
            />
            <p className="text-sm text-gray-500 mt-1">
              Separate multiple types with commas (e.g., image/*, .pdf, .docx)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Max File Size (MB)</Label>
              <Input
                type="number"
                value={field.maxFileSize || 10}
                onChange={(e) =>
                  onUpdate({ maxFileSize: parseInt(e.target.value) || 10 })
                }
              />
            </div>
            <div>
              <Label>Max Files</Label>
              <Input
                type="number"
                min="1"
                value={field.maxFiles || 1}
                onChange={(e) =>
                  onUpdate({ maxFiles: parseInt(e.target.value) || 1 })
                }
              />
            </div>
          </div>
        </div>
      );

    case "yes-no":
      return assignmentMode ? (
        <div className="p-4 bg-blue-50 rounded-lg space-y-3">
          <h4 className="font-medium text-blue-900">Assignment Settings</h4>
          <div>
            <Label>Correct Answer</Label>
            <Select
              value={field.correctAnswer || ""}
              onValueChange={(value) => onUpdate({ correctAnswer: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select correct answer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Explanation</Label>
            <Textarea
              value={field.explanation || ""}
              onChange={(e) => onUpdate({ explanation: e.target.value })}
              placeholder="Explain the correct answer"
              rows={2}
            />
          </div>
        </div>
      ) : null;

    case "phone":
      return (
        <div className="space-y-4">
          <div>
            <Label>Phone Format Pattern</Label>
            <Input
              value={field.pattern || ""}
              onChange={(e) => onUpdate({ pattern: e.target.value })}
              placeholder="e.g., \\d{3}-\\d{3}-\\d{4}"
            />
            <p className="text-sm text-gray-500 mt-1">
              Use regex pattern to validate phone format
            </p>
          </div>
        </div>
      );

    case "signature":
      return (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Signature fields will display a drawing canvas for users to sign
            digitally.
          </p>
        </div>
      );

    case "address":
      return (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Address fields will provide structured input for street, city,
            state, and postal code.
          </p>
        </div>
      );

    default:
      return null;
  }
}

// Field Preview Component
function FieldPreview({ field }: { field: FormField }) {
  const renderField = () => {
    switch (field.type) {
      case "short-text":
      case "email":
      case "url":
      case "phone":
        return (
          <Input
            placeholder={
              field.placeholder || `Enter ${field.label.toLowerCase()}`
            }
            disabled
            className="opacity-60"
          />
        );

      case "paragraph":
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
            min={field.minValue}
            max={field.maxValue}
            step={field.step}
          />
        );

      case "date":
        return <Input type="date" disabled className="opacity-60" />;

      case "time":
        return <Input type="time" disabled className="opacity-60" />;

      case "datetime":
        return <Input type="datetime-local" disabled className="opacity-60" />;

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
            {field.allowOther && (
              <div className="flex items-center gap-2">
                <input
                  type={field.allowMultiple ? "checkbox" : "radio"}
                  name={`preview-${field.id}`}
                  disabled
                  className="opacity-60"
                />
                <span className="text-sm opacity-60">Other:</span>
                <Input
                  className="opacity-60"
                  disabled
                  placeholder="Please specify"
                />
              </div>
            )}
          </div>
        );

      case "checkbox":
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input type="checkbox" disabled className="opacity-60" />
                <span className="text-sm opacity-60">{option}</span>
              </div>
            ))}
          </div>
        );

      case "dropdown":
        return (
          <Select disabled>
            <SelectTrigger className="opacity-60">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
          </Select>
        );

      case "yes-no":
        return (
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name={`preview-${field.id}`}
                disabled
                className="opacity-60"
              />
              <span className="text-sm opacity-60">Yes</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name={`preview-${field.id}`}
                disabled
                className="opacity-60"
              />
              <span className="text-sm opacity-60">No</span>
            </div>
          </div>
        );

      case "rating":
        return (
          <div className="flex gap-1">
            {Array.from({ length: field.maxRating || 5 }, (_, i) => (
              <span
                key={i}
                className="text-gray-300 text-xl cursor-pointer hover:text-yellow-400"
              >
                ★
              </span>
            ))}
          </div>
        );

      case "linear-scale":
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{field.scaleLabels?.min || field.minScale}</span>
              <span>{field.scaleLabels?.max || field.maxScale}</span>
            </div>
            <div className="flex gap-2">
              {Array.from(
                { length: (field.maxScale || 10) - (field.minScale || 1) + 1 },
                (_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <input
                      type="radio"
                      name={`preview-${field.id}`}
                      disabled
                      className="opacity-60"
                    />
                    <span className="text-xs text-gray-500 mt-1">
                      {(field.minScale || 1) + i}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        );

      case "file-upload":
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center opacity-60">
            <div className="text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-2 text-sm">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-400">
                {field.allowedFileTypes?.join(", ") || "Any file type"}
                {field.maxFileSize && ` (Max: ${field.maxFileSize}MB)`}
              </p>
            </div>
          </div>
        );

      case "signature":
        return (
          <div className="border rounded-lg p-4 bg-gray-50 opacity-60">
            <div className="h-24 flex items-center justify-center text-gray-500">
              <span>✍️ Signature pad will appear here</span>
            </div>
          </div>
        );

      case "address":
        return (
          <div className="space-y-2 opacity-60">
            <Input placeholder="Street Address" disabled />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="City" disabled />
              <Input placeholder="State/Province" disabled />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Postal Code" disabled />
              <Input placeholder="Country" disabled />
            </div>
          </div>
        );

      default:
        return <div className="text-gray-400 text-sm">Unknown field type</div>;
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <label className="block text-sm font-medium">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.width === "half" && (
          <Badge variant="outline" className="text-xs">
            Half Width
          </Badge>
        )}
      </div>
      {field.description && (
        <p className="text-xs text-gray-500 mb-2">{field.description}</p>
      )}
      {renderField()}
    </div>
  );
}
