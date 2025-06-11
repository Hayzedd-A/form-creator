"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Star,
  Upload,
  Calendar,
  Clock,
  MapPin,
  PenTool,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

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

interface Form {
  _id: string;
  title: string;
  description?: string;
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
}

interface AssignmentResult {
  fieldId: string;
  userAnswer: any;
  correctAnswer: any;
  isCorrect: boolean;
  explanation?: string;
}

export default function PublicForm() {
  const params = useParams();
  const slug = params.slug as string;

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [assignmentResults, setAssignmentResults] = useState<
    AssignmentResult[]
  >([]);
  const [currentStep, setCurrentStep] = useState<
    "email" | "form" | "submitted" | "results"
  >("form");
  const [userEmail, setUserEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchForm();
    }
  }, [slug]);

  useEffect(() => {
    if (form && form.settings.showProgressBar) {
      const totalFields = form.fields.length;
      const completedFields = Object.keys(responses).filter(
        (key) =>
          responses[key] !== "" &&
          responses[key] !== null &&
          responses[key] !== undefined
      ).length;
      setProgress((completedFields / totalFields) * 100);
    }
  }, [responses, form]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setForm(data.form);

        // Check if already submitted
        if (data.alreadySubmitted) {
          setAlreadySubmitted(true);
          setCurrentStep("submitted");
        } else if (data.form.settings.collectEmail) {
          setCurrentStep("email");
        } else {
          setCurrentStep("form");
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Form not found");
      }
    } catch (error: unknown) {
      console.log(error)
      toast.error("Error loading form");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      toast.error("Email is required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Check if email is allowed (if restrictions exist)
    if (
      form?.settings.allowedEmails.length > 0 &&
      !form.settings.allowedEmails.includes(emailInput)
    ) {
      toast.error("Your email is not authorized to access this form");
      return;
    }

    // Check if already submitted by email
    try {
      const response = await fetch(`/api/forms/${slug}/check-submission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
      });

      const data = await response.json();
      if (data.alreadySubmitted) {
        setAlreadySubmitted(true);
        setCurrentStep("submitted");
        return;
      }
    } catch (error) {
      console.error("Error checking submission:", error);
    }

    setUserEmail(emailInput);
    setCurrentStep("form");
  };

  const validateField = (field: FormField, value: any): string | null => {
    if (
      field.required &&
      (!value || (Array.isArray(value) && value.length === 0))
    ) {
      return `${field.label} is required`;
    }

    if (value) {
      // Text length validation
      if (
        field.minLength &&
        typeof value === "string" &&
        value.length < field.minLength
      ) {
        return `${field.label} must be at least ${field.minLength} characters`;
      }
      if (
        field.maxLength &&
        typeof value === "string" &&
        value.length > field.maxLength
      ) {
        return `${field.label} must be no more than ${field.maxLength} characters`;
      }

      // Number validation
      if (field.type === "number") {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          return `${field.label} must be a valid number`;
        }
        if (field.minValue !== undefined && numValue < field.minValue) {
          return `${field.label} must be at least ${field.minValue}`;
        }
        if (field.maxValue !== undefined && numValue > field.maxValue) {
          return `${field.label} must be no more than ${field.maxValue}`;
        }
      }

      // Email validation
      if (field.type === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return `${field.label} must be a valid email address`;
        }
      }

      // URL validation
      if (field.type === "url") {
        try {
          new URL(value);
        } catch {
          return `${field.label} must be a valid URL`;
        }
      }

      // Date validation
      if (field.type === "date" || field.type === "datetime") {
        const dateValue = new Date(value);
        if (field.minDate && dateValue < new Date(field.minDate)) {
          return `${field.label} must be after ${field.minDate}`;
        }
        if (field.maxDate && dateValue > new Date(field.maxDate)) {
          return `${field.label} must be before ${field.maxDate}`;
        }
      }
    }

    return null;
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [fieldId]: value,
    }));

    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors((prev) => ({
        ...prev,
        [fieldId]: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    // Validate all fields
    const newErrors: Record<string, string> = {};
    form.fields.forEach((field) => {
      const error = validateField(field, responses[field.id]);
      if (error) {
        newErrors[field.id] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors in the form");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/forms/${slug}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          responses,
          email: userEmail || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          form.settings.customSuccessMessage || "Form submitted successfully!"
        );
        setSubmitted(true);

        if (form.settings.assignmentMode && data.results) {
          setAssignmentResults(data.results);
          setCurrentStep("results");
        } else {
          setCurrentStep("submitted");

          // Redirect if URL is provided
          if (form.settings.redirectUrl) {
            setTimeout(() => {
              window.location.href = form.settings.redirectUrl!;
            }, 2000);
          }
        }
      } else {
        toast.error(data.error || "Failed to submit form");
      }
    } catch (error) {
      toast.error("An error occurred while submitting");
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const fieldError = errors[field.id];
    const fieldValue = responses[field.id];

    const fieldWrapper = (children: React.ReactNode) => (
      <div
        className={`space-y-2 ${
          field.width === "half" ? "md:col-span-1" : "md:col-span-2"
        }`}
      >
        <Label className="block text-sm font-medium">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {field.description && (
          <p className="text-sm text-gray-600">{field.description}</p>
        )}
        {children}
        {fieldError && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {fieldError}
          </p>
        )}
      </div>
    );

    switch (field.type) {
      case "short-text":
        return fieldWrapper(
          <Input
            value={fieldValue || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            className={fieldError ? "border-red-500" : ""}
          />
        );

      case "paragraph":
        return fieldWrapper(
          <Textarea
            value={fieldValue || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            className={`resize-none h-24 ${fieldError ? "border-red-500" : ""}`}
          />
        );

      case "email":
        return fieldWrapper(
          <Input
            type="email"
            value={fieldValue || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder || "Enter your email"}
            className={fieldError ? "border-red-500" : ""}
          />
        );

      case "number":
        return fieldWrapper(
          <Input
            type="number"
            value={fieldValue || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            min={field.minValue}
            max={field.maxValue}
            step={field.step}
            className={fieldError ? "border-red-500" : ""}
          />
        );

      case "phone":
        return fieldWrapper(
          <Input
            type="tel"
            value={fieldValue || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder || "Enter phone number"}
            className={fieldError ? "border-red-500" : ""}
          />
        );

      case "url":
        return fieldWrapper(
          <Input
            type="url"
            value={fieldValue || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder || "https://example.com"}
            className={fieldError ? "border-red-500" : ""}
          />
        );

      case "date":
        return fieldWrapper(
          <Input
            type="date"
            value={fieldValue || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            min={field.minDate}
            max={field.maxDate}
            className={fieldError ? "border-red-500" : ""}
          />
        );

      case "time":
        return fieldWrapper(
          <Input
            type="time"
            value={fieldValue || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={fieldError ? "border-red-500" : ""}
          />
        );

      case "datetime":
        return fieldWrapper(
          <Input
            type="datetime-local"
            value={fieldValue || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            min={field.minDate}
            max={field.maxDate}
            className={fieldError ? "border-red-500" : ""}
          />
        );

      case "multiple-choice":
        return fieldWrapper(
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label
                key={index}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type={field.allowMultiple ? "checkbox" : "radio"}
                  name={field.id}
                  value={option}
                  checked={
                    field.allowMultiple
                      ? (fieldValue || []).includes(option)
                      : fieldValue === option
                  }
                  onChange={(e) => {
                    if (field.allowMultiple) {
                      const current = fieldValue || [];
                      if (e.target.checked) {
                        handleInputChange(field.id, [...current, option]);
                      } else {
                        handleInputChange(
                          field.id,
                          current.filter((item: string) => item !== option)
                        );
                      }
                    } else {
                      handleInputChange(field.id, option);
                    }
                  }}
                  className="rounded"
                />
                <span>{option}</span>
              </label>
            ))}
            {field.allowOther && (
              <div className="flex items-center space-x-2">
                <input
                  type={field.allowMultiple ? "checkbox" : "radio"}
                  name={field.id}
                  value="__other__"
                  checked={
                    field.allowMultiple
                      ? (fieldValue || []).includes("__other__")
                      : fieldValue === "__other__"
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (field.allowMultiple) {
                        const current = fieldValue || [];
                        handleInputChange(field.id, [...current, "__other__"]);
                      } else {
                        handleInputChange(field.id, "__other__");
                      }
                    }
                  }}
                  className="rounded"
                />
                <Input
                  placeholder="Other (please specify)"
                  value={responses[`${field.id}_other`] || ""}
                  onChange={(e) =>
                    handleInputChange(`${field.id}_other`, e.target.value)
                  }
                  className="flex-1"
                />
              </div>
            )}
          </div>
        );

      case "checkbox":
        return fieldWrapper(
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label
                key={index}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={option}
                  checked={(fieldValue || []).includes(option)}
                  onChange={(e) => {
                    const current = fieldValue || [];
                    if (e.target.checked) {
                      handleInputChange(field.id, [...current, option]);
                    } else {
                      handleInputChange(
                        field.id,
                        current.filter((item: string) => item !== option)
                      );
                    }
                  }}
                  className="rounded"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case "dropdown":
        return fieldWrapper(
          <Select
            value={fieldValue || ""}
            onValueChange={(value) => handleInputChange(field.id, value)}
          >
            <SelectTrigger className={fieldError ? "border-red-500" : ""}>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "yes-no":
        return fieldWrapper(
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={field.id}
                value="yes"
                checked={fieldValue === "yes"}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className="rounded"
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={field.id}
                value="no"
                checked={fieldValue === "no"}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className="rounded"
              />
              <span>No</span>
            </label>
          </div>
        );

      case "rating":
        return fieldWrapper(
          <div className="flex space-x-1">
            {Array.from({ length: field.maxRating || 5 }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleInputChange(field.id, index + 1)}
                className="focus:outline-none transition-colors"
              >
                <Star
                  className={`w-6 h-6 ${
                    (fieldValue || 0) > index
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300 hover:text-yellow-200"
                  }`}
                />
              </button>
            ))}
            {fieldValue && (
              <span className="ml-2 text-sm text-gray-600">
                {fieldValue} out of {field.maxRating || 5}
              </span>
            )}
          </div>
        );

      case "linear-scale":
        return fieldWrapper(
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{field.scaleLabels?.min || field.minScale || 1}</span>
              <span>{field.scaleLabels?.max || field.maxScale || 10}</span>
            </div>
            <div className="flex space-x-2 justify-between">
              {Array.from(
                { length: (field.maxScale || 10) - (field.minScale || 1) + 1 },
                (_, index) => {
                  const value = (field.minScale || 1) + index;
                  return (
                    <label
                      key={value}
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={field.id}
                        value={value}
                        checked={fieldValue === value}
                        onChange={(e) =>
                          handleInputChange(field.id, parseInt(e.target.value))
                        }
                        className="mb-1"
                      />
                      <span className="text-sm">{value}</span>
                    </label>
                  );
                }
              )}
            </div>
          </div>
        );

      case "file-upload":
        return fieldWrapper(
          <div className="space-y-2">
            <input
              type="file"
              multiple={field.maxFiles && field.maxFiles > 1}
              accept={field.allowedFileTypes?.join(",") || "image/*"}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (field.maxFiles && files.length > field.maxFiles) {
                  toast.error(`Maximum ${field.maxFiles} files allowed`);
                  return;
                }

                // Check file sizes
                const maxSize = (field.maxFileSize || 10) * 1024 * 1024; // Convert MB to bytes
                const oversizedFiles = files.filter(
                  (file) => file.size > maxSize
                );
                if (oversizedFiles.length > 0) {
                  toast.error(
                    `Files must be smaller than ${field.maxFileSize || 10}MB`
                  );
                  return;
                }

                handleInputChange(field.id, files);
              }}
              className={`w-full px-3 py-2 border rounded-md ${
                fieldError ? "border-red-500" : "border-input"
              }`}
            />
            <div className="text-xs text-gray-500">
              {field.maxFileSize &&
                `Max size: ${field.maxFileSize}MB per file. `}
              {field.maxFiles &&
                field.maxFiles > 1 &&
                `Max files: ${field.maxFiles}. `}
              {field.allowedFileTypes &&
                `Allowed types: ${field.allowedFileTypes.join(", ")}`}
            </div>
          </div>
        );

      case "signature":
        return fieldWrapper(
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <PenTool className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              Signature field (implementation needed)
            </p>
            <Input
              placeholder="Type your full name as signature"
              value={fieldValue || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="mt-2"
            />
          </div>
        );

      case "address":
        return fieldWrapper(
          <div className="space-y-2">
            <Input
              placeholder="Street Address"
              value={fieldValue?.street || ""}
              onChange={(e) =>
                handleInputChange(field.id, {
                  ...fieldValue,
                  street: e.target.value,
                })
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="City"
                value={fieldValue?.city || ""}
                onChange={(e) =>
                  handleInputChange(field.id, {
                    ...fieldValue,
                    city: e.target.value,
                  })
                }
              />
              <Input
                placeholder="State/Province"
                value={fieldValue?.state || ""}
                onChange={(e) =>
                  handleInputChange(field.id, {
                    ...fieldValue,
                    state: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="ZIP/Postal Code"
                value={fieldValue?.zip || ""}
                onChange={(e) =>
                  handleInputChange(field.id, {
                    ...fieldValue,
                    zip: e.target.value,
                  })
                }
              />
              <Input
                placeholder="Country"
                value={fieldValue?.country || ""}
                onChange={(e) =>
                  handleInputChange(field.id, {
                    ...fieldValue,
                    country: e.target.value,
                  })
                }
              />
            </div>
          </div>
        );

      default:
        return fieldWrapper(
          <div className="text-gray-500 italic">
            Unsupported field type: {field.type}
          </div>
        );
    }
  };

  // Check if form is accessible
  const isFormAccessible = () => {
    if (!form) return false;

    const now = new Date();
    if (form.settings.openDate && now < new Date(form.settings.openDate)) {
      return false;
    }
    if (form.settings.closeDate && now > new Date(form.settings.closeDate)) {
      return false;
    }

    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Form Not Found</h2>
            <p className="text-gray-600">
              The form you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isFormAccessible()) {
    const now = new Date();
    const isNotYetOpen =
      form.settings.openDate && now < new Date(form.settings.openDate);
    const isClosed =
      form.settings.closeDate && now > new Date(form.settings.closeDate);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <Clock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {isNotYetOpen ? "Form Not Yet Available" : "Form Closed"}
            </h2>
            <p className="text-gray-600">
              {isNotYetOpen
                ? `This form will be available starting ${new Date(
                    form.settings.openDate!
                  ).toLocaleString()}`
                : `This form closed on ${new Date(
                    form.settings.closeDate!
                  ).toLocaleString()}`}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Already Submitted</h2>
            <p className="text-gray-600">
              You have already submitted a response to this form.
              {form.settings.limitOneResponse &&
                " Only one response per user is allowed."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Email collection step
  if (currentStep === "email") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle>Email Required</CardTitle>
            <CardDescription>
              Please provide your email address to access this form
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Continue to Form
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }
  // Assignment results step
  if (currentStep === "results" && form.settings.assignmentMode) {
    const totalQuestions = assignmentResults.length;
    const correctAnswers = assignmentResults.filter(
      (result) => result.isCorrect
    ).length;
    const score =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="mb-6">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Assignment Results</CardTitle>
              <CardDescription>
                Here are your results for "{form.title}"
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6">
                <div
                  className="text-4xl font-bold mb-2"
                  style={{
                    color:
                      score >= 70
                        ? "#22c55e"
                        : score >= 50
                        ? "#f59e0b"
                        : "#ef4444",
                  }}
                >
                  {score}%
                </div>
                <p className="text-gray-600">
                  {correctAnswers} out of {totalQuestions} correct
                </p>
                <Badge
                  variant={score >= 70 ? "default" : "secondary"}
                  className="mt-2"
                >
                  {score >= 70 ? "Passed" : "Needs Improvement"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {assignmentResults.map((result, index) => {
              const field = form.fields.find((f) => f.id === result.fieldId);
              if (!field) return null;

              return (
                <Card key={result.fieldId} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">
                        Question {index + 1}: {field.label}
                      </CardTitle>
                      <Badge
                        variant={result.isCorrect ? "default" : "destructive"}
                      >
                        {result.isCorrect ? "Correct" : "Incorrect"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Your Answer:
                        </Label>
                        <div
                          className={`p-2 rounded border ${
                            result.isCorrect
                              ? "bg-green-50 border-green-200"
                              : "bg-red-50 border-red-200"
                          }`}
                        >
                          {Array.isArray(result.userAnswer)
                            ? result.userAnswer.join(", ")
                            : result.userAnswer?.toString() ||
                              "No answer provided"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Correct Answer:
                        </Label>
                        <div className="p-2 rounded border bg-green-50 border-green-200">
                          {Array.isArray(result.correctAnswer)
                            ? result.correctAnswer.join(", ")
                            : result.correctAnswer?.toString()}
                        </div>
                      </div>
                    </div>
                    {result.explanation && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Explanation:
                        </Label>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm">{result.explanation}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="mr-4"
            >
              Try Again
            </Button>
            {form.settings.redirectUrl && (
              <Button
                onClick={() =>
                  (window.location.href = form.settings.redirectUrl!)
                }
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Success step
  if (currentStep === "submitted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-4">
              {form.settings.customSuccessMessage ||
                "Your response has been submitted successfully."}
            </p>
            {form.settings.redirectUrl && (
              <Button
                onClick={() =>
                  (window.location.href = form.settings.redirectUrl!)
                }
                className="mt-4"
              >
                Continue
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main form step
  const customTheme = form.settings.customTheme || {};
  const formStyle = {
    "--primary-color": customTheme.primaryColor || "#3b82f6",
    "--bg-color": customTheme.backgroundColor || "#ffffff",
    "--text-color": customTheme.textColor || "#1f2937",
    fontFamily: customTheme.fontFamily || "inherit",
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-gray-50 py-8" style={formStyle}>
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress Bar */}
        {form.settings.showProgressBar && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <Card style={{ backgroundColor: customTheme.backgroundColor }}>
          <CardHeader>
            <CardTitle
              className="text-2xl"
              style={{ color: customTheme.textColor }}
            >
              {form.title}
            </CardTitle>
            {form.description && (
              <CardDescription
                className="text-base"
                style={{ color: customTheme.textColor }}
              >
                {form.description}
              </CardDescription>
            )}
            {form.settings.assignmentMode && (
              <Badge variant="secondary" className="w-fit">
                Assignment Mode - You will see results after submission
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {form.fields
                  .sort((a, b) => a.order - b.order)
                  .map((field) => (
                    <div key={field.id}>{renderField(field)}</div>
                  ))}
              </div>

              <div className="flex justify-between items-center pt-6 border-t">
                {form.settings.allowSaveDraft && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      localStorage.setItem(
                        `form_draft_${slug}`,
                        JSON.stringify(responses)
                      );
                      toast.success("Draft saved!");
                    }}
                  >
                    Save Draft
                  </Button>
                )}
                <div className="flex-1"></div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="min-w-[120px]"
                  style={{ backgroundColor: customTheme.primaryColor }}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Form Footer Info */}
        <div className="mt-4 text-center text-sm text-gray-500">
          {form.settings.limitOneResponse && (
            <p>• Only one response per user is allowed</p>
          )}
          {form.settings.closeDate && (
            <p>
              • Form closes on{" "}
              {new Date(form.settings.closeDate).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
