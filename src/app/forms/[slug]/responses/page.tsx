"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Download,
  Eye,
  Filter,
  Search,
  BarChart3,
  PieChart,
  Calendar,
  Mail,
  MapPin,
  Star,
  FileText,
  Trash2,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import ResponseDetailModal from "@/components/ResponseDetailModal";

interface FormResponse {
  _id: string;
  responses: Array<{
    fieldId: string;
    value: any;
    fileUrl?: string;
    isCorrect?: boolean;
    score?: number;
  }>;
  submitterEmail?: string;
  submitterIp: string;
  submitterLocation?: {
    country?: string;
    city?: string;
    region?: string;
  };
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
  };
  timeSpent?: number;
  totalScore?: number;
  maxScore?: number;
  grade?: string;
  createdAt: string;
  updatedAt?: string;
  status: "completed" | "draft" | "partial";
}

interface FormField {
  id: string;
  type: string;
  label: string;
  options?: string[];
  maxRating?: number;
  minScale?: number;
  maxScale?: number;
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
    assignmentMode: boolean;
    collectEmail: boolean;
    collectIP: boolean;
    showProgressBar: boolean;
    customTheme?: {
      primaryColor?: string;
      backgroundColor?: string;
      textColor?: string;
    };
  };
  analytics: {
    views: number;
    submissions: number;
    averageTime?: number;
    completionRate?: number;
    topExitPoints?: Array<{ fieldId: string; count: number }>;
  };
}

interface AnalyticsData {
  totalResponses: number;
  completedResponses: number;
  draftResponses: number;
  averageScore?: number;
  responsesByDate: Array<{ date: string; count: number }>;
  responsesByLocation: Array<{ location: string; count: number }>;
  fieldAnalytics: Array<{
    fieldId: string;
    fieldLabel: string;
    responseCount: number;
    averageValue?: number;
    mostCommonAnswer?: string;
    correctRate?: number;
  }>;
}

export default function FormResponses() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [response, setResponse] = useState<FormResponse>({})
  const [filteredResponses, setFilteredResponses] = useState<FormResponse[]>(
    []
  );
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("responses");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    fetchFormAndResponses();
  }, [session, status, router, slug]);

  useEffect(() => {
    applyFilters();
  }, [responses, searchTerm, statusFilter, dateFilter, sortBy]);

  const fetchFormAndResponses = async () => {
    try {
      let formData = null;
      // Fetch form details
      const formResponse = await fetch(`/api/forms/${slug}/details`);
      if (formResponse.ok) {
        formData = await formResponse.json();
        setForm(formData.form);
      }

      // Fetch responses
      const responsesResponse = await fetch(`/api/forms/${slug}/responses`);
      if (responsesResponse.ok) {
        const responsesData = await responsesResponse.json();
        setResponses(responsesData.responses);

        // Calculate analytics
        const analyticsData = calculateAnalytics(
          responsesData.responses,
          formData.form
        );
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load form data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResponse = async (responseId: string) => {
    try {
      const response = await fetch(
        `/api/forms/${slug}/responses/${responseId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Refresh the responses data
        fetchFormAndResponses();
      } else {
        throw new Error("Failed to delete response");
      }
    } catch (error) {
      throw error;
    }
  };

  const calculateAnalytics = (
    responses: FormResponse[],
    form: Form
  ): AnalyticsData => {
    const totalResponses = responses.length;
    const completedResponses = responses.filter(
      (r) => r.status === "completed"
    ).length;
    const draftResponses = responses.filter((r) => r.status === "draft").length;

    // Calculate average score for assignment mode
    const averageScore = form.settings.assignmentMode
      ? responses.reduce((sum, r) => sum + (r.totalScore || 0), 0) /
        totalResponses
      : undefined;

    // Group responses by date
    const responsesByDate = responses.reduce((acc, response) => {
      const date = new Date(response.createdAt).toISOString().split("T")[0];
      const existing = acc.find((item) => item.date === date);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ date, count: 1 });
      }
      return acc;
    }, [] as Array<{ date: string; count: number }>);

    // Group responses by location
    const responsesByLocation = responses.reduce((acc, response) => {
      const location = response.submitterLocation?.country || "Unknown";
      const existing = acc.find((item) => item.location === location);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ location, count: 1 });
      }
      return acc;
    }, [] as Array<{ location: string; count: number }>);

    // Calculate field analytics
    const fieldAnalytics = form.fields.map((field) => {
      const fieldResponses = responses
        .map((r) => r.responses.find((resp) => resp.fieldId === field.id))
        .filter(Boolean);

      const responseCount = fieldResponses.length;
      let averageValue: number | undefined;
      let mostCommonAnswer: string | undefined;
      let correctRate: number | undefined;

      if (
        field.type === "rating" ||
        field.type === "linear-scale" ||
        field.type === "number"
      ) {
        const values = fieldResponses
          .map((r) => Number(r?.value))
          .filter((v) => !isNaN(v));
        averageValue =
          values.length > 0
            ? values.reduce((sum, v) => sum + v, 0) / values.length
            : undefined;
      }

      if (
        field.type === "multiple-choice" ||
        field.type === "dropdown" ||
        field.type === "yes-no"
      ) {
        const valueCounts = fieldResponses.reduce((acc, r) => {
          const value = Array.isArray(r?.value)
            ? r.value.join(", ")
            : String(r?.value || "");
          acc[value] = (acc[value] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        mostCommonAnswer = Object.entries(valueCounts).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0];
      }

      if (form.settings.assignmentMode && field.correctAnswer) {
        const correctResponses = fieldResponses.filter(
          (r) => r?.isCorrect
        ).length;
        correctRate =
          responseCount > 0 ? (correctResponses / responseCount) * 100 : 0;
      }

      return {
        fieldId: field.id,
        fieldLabel: field.label,
        responseCount,
        averageValue,
        mostCommonAnswer,
        correctRate,
      };
    });

    return {
      totalResponses,
      completedResponses,
      draftResponses,
      averageScore,
      responsesByDate: responsesByDate.sort((a, b) =>
        a.date.localeCompare(b.date)
      ),
      responsesByLocation: responsesByLocation.sort(
        (a, b) => b.count - a.count
      ),
      fieldAnalytics,
    };
  };

  const applyFilters = () => {
    let filtered = [...responses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (response) =>
          response.submitterEmail
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          response.submitterIp.includes(searchTerm) ||
          response.responses.some((r) =>
            String(r.value).toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (response) => response.status === statusFilter
      );
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      if (dateFilter !== "all") {
        filtered = filtered.filter(
          (response) => new Date(response.createdAt) >= filterDate
        );
      }
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "score":
          if (form?.settings.assignmentMode) {
            return (b.totalScore || 0) - (a.totalScore || 0);
          }
          return 0;
        case "email":
          return (a.submitterEmail || "").localeCompare(b.submitterEmail || "");
        default:
          return 0;
      }
    });

    setFilteredResponses(filtered);
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    if (!form || filteredResponses.length === 0) return;

    // Create CSV headers
    const headers = [
      "Submission Date",
      "Status",
      ...(form.settings.collectEmail ? ["Email"] : []),
      ...(form.settings.collectIP ? ["IP Address"] : []),
      "Location",
      "Device",
      "Time Spent (seconds)",
      ...(form.settings.assignmentMode ? ["Score", "Grade"] : []),
      ...form.fields.map((field) => field.label),
    ];

    // Create CSV rows
    const rows = filteredResponses.map((response) => {
      const row = [
        formatDate(new Date(response.createdAt)),
        response.status,
        ...(form.settings.collectEmail ? [response.submitterEmail || ""] : []),
        ...(form.settings.collectIP ? [response.submitterIp] : []),
        response.submitterLocation
          ? `${response.submitterLocation.city || ""}, ${
              response.submitterLocation.country || ""
            }`
              .trim()
              .replace(/^,\s*/, "")
          : "",
        response.deviceInfo
          ? `${response.deviceInfo.browser || ""} on ${
              response.deviceInfo.os || ""
            }`.trim()
          : "",
        response.timeSpent?.toString() || "",
        ...(form.settings.assignmentMode
          ? [response.totalScore?.toString() || "", response.grade || ""]
          : []),
      ];

      // Add field values
      form.fields.forEach((field) => {
        const fieldResponse = response.responses.find(
          (r) => r.fieldId === field.id
        );
        let value = fieldResponse?.value || "";

        // Handle arrays (multiple choice)
        if (Array.isArray(value)) {
          value = value.join(", ");
        }

        // Handle file uploads
        if (field.type === "file-upload" && fieldResponse?.fileUrl) {
          value = fieldResponse.fileUrl;
        }

        // Add score for assignment mode
        if (
          form.settings.assignmentMode &&
          fieldResponse?.isCorrect !== undefined
        ) {
          value = `${value} (${fieldResponse.isCorrect ? "✓" : "✗"})`;
        }

        row.push(value.toString());
      });

      return row;
    });

    // Create CSV content
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.title}-responses-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("CSV exported successfully");
  };

  const exportToJSON = () => {
    if (!form || filteredResponses.length === 0) return;

    const exportData = {
      form: {
        title: form.title,
        slug: form.slug,
        fields: form.fields,
      },
      responses: filteredResponses,
      exportDate: new Date().toISOString(),
      totalCount: filteredResponses.length,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.title}-responses-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("JSON exported successfully");
  };

  const deleteResponse = async (responseId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this response? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/forms/${slug}/responses/${responseId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setResponses((prev) => prev.filter((r) => r._id !== responseId));
        toast.success("Response deleted successfully");
      } else {
        toast.error("Failed to delete response");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the response");
    }
  };

  const renderFieldValue = (field: FormField, response: any) => {
    const fieldResponse = response.responses.find(
      (r: any) => r.fieldId === field.id
    );
    if (
      !fieldResponse ||
      fieldResponse.value === null ||
      fieldResponse.value === undefined
    ) {
      return <span className="text-gray-400">-</span>;
    }

    const value = fieldResponse.value;
    const isCorrect = fieldResponse.isCorrect;

    switch (field.type) {
      case "multiple-choice":
      case "checkbox":
        const displayValue = Array.isArray(value) ? value.join(", ") : value;
        return (
          <div className="flex items-center gap-2">
            <span className="max-w-xs truncate">{displayValue}</span>
            {form?.settings.assignmentMode && isCorrect !== undefined && (
              <Badge
                variant={isCorrect ? "default" : "destructive"}
                className="text-xs"
              >
                {isCorrect ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
              </Badge>
            )}
          </div>
        );

      case "rating":
        return (
          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: field.maxRating || 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < value ? "text-yellow-400 fill-current" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              ({value}/{field.maxRating || 5})
            </span>
            {form?.settings.assignmentMode && isCorrect !== undefined && (
              <Badge
                variant={isCorrect ? "default" : "destructive"}
                className="text-xs"
              >
                {isCorrect ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
              </Badge>
            )}
          </div>
        );

      case "linear-scale":
        return (
          <div className="flex items-center gap-2">
            <span>
              {value}/{field.maxScale || 10}
            </span>
            {form?.settings.assignmentMode && isCorrect !== undefined && (
              <Badge
                variant={isCorrect ? "default" : "destructive"}
                className="text-xs"
              >
                {isCorrect ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
              </Badge>
            )}
          </div>
        );

      case "file-upload":
        return fieldResponse.fileUrl ? (
          <a
            href={fieldResponse.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            <FileText className="w-4 h-4" />
            View File
          </a>
        ) : (
          <span className="text-gray-400">No file</span>
        );

      case "yes-no":
        return (
          <div className="flex items-center gap-2">
            <Badge variant={value === "yes" ? "default" : "secondary"}>
              {value === "yes" ? "Yes" : "No"}
            </Badge>
            {form?.settings.assignmentMode && isCorrect !== undefined && (
              <Badge
                variant={isCorrect ? "default" : "destructive"}
                className="text-xs"
              >
                {isCorrect ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
              </Badge>
            )}
          </div>
        );

      case "date":
      case "datetime":
        return (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{new Date(value).toLocaleDateString()}</span>
          </div>
        );

      case "email":
        return (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="max-w-xs truncate">{value}</span>
          </div>
        );

      case "address":
        return (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="max-w-xs truncate">
              {typeof value === "object"
                ? `${value.street || ""}, ${value.city || ""}, ${
                    value.state || ""
                  } ${value.postal || ""}`.trim()
                : value}
            </span>
          </div>
        );

      default:
        return (
          <div className="flex items-center gap-2">
            <span className="max-w-xs truncate">{String(value)}</span>
            {form?.settings.assignmentMode && isCorrect !== undefined && (
              <Badge
                variant={isCorrect ? "default" : "destructive"}
                className="text-xs"
              >
                {isCorrect ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
              </Badge>
            )}
          </div>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        );
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "partial":
        return <Badge variant="outline">Partial</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getGradeBadge = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    let variant: "default" | "secondary" | "destructive" = "secondary";
    let color = "text-gray-800";

    if (percentage >= 90) {
      variant = "default";
      color = "text-green-800";
    } else if (percentage >= 70) {
      color = "text-blue-800";
    } else if (percentage >= 60) {
      color = "text-yellow-800";
    } else {
      variant = "destructive";
    }

    return (
      <Badge variant={variant} className={color}>
        {score}/{maxScore} ({Math.round(percentage)}%)
      </Badge>
    );
  };

  // Pagination
  const totalPages = Math.ceil(filteredResponses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResponses = filteredResponses.slice(startIndex, endIndex);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || !form) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                <h1 className="text-2xl font-bold text-gray-900">
                  {form.title}
                </h1>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-gray-600">
                    {analytics?.totalResponses || 0} responses
                  </p>
                  {form.settings.assignmentMode && analytics?.averageScore && (
                    <p className="text-gray-600">
                      Avg Score: {Math.round(analytics.averageScore * 10) / 10}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fetchFormAndResponses()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportToJSON}>
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button
                variant="outline"
                onClick={exportToCSV}
                disabled={filteredResponses.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/form/${slug}`} target="_blank">
                  <Eye className="w-4 h-4 mr-2" />
                  View Form
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/forms/${slug}/edit`}>Edit Form</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="responses" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Responses ({filteredResponses.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Responses
                      </p>
                      <p className="text-2xl font-bold">
                        {analytics?.totalResponses || 0}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Completed
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {analytics?.completedResponses || 0}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Drafts
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {analytics?.draftResponses || 0}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              {form.settings.assignmentMode && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Avg Score
                        </p>
                        <p className="text-2xl font-bold text-purple-600">
                          {analytics?.averageScore
                            ? Math.round(analytics.averageScore * 10) / 10
                            : 0}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recent Responses */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Responses</CardTitle>
                <CardDescription>Latest 5 form submissions</CardDescription>
              </CardHeader>
              <CardContent>
                {responses.slice(0, 5).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">
                      No responses yet
                    </h3>
                    <p>Share your form to start collecting responses</p>
                    <Button className="mt-4" asChild>
                      <Link href={`/form/${slug}`} target="_blank">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Form
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {responses.slice(0, 5).map((response) => (
                      <div
                        key={response._id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          {getStatusBadge(response.status)}
                          <div>
                            <p className="font-medium">
                              {response.submitterEmail ||
                                `IP: ${response.submitterIp}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(new Date(response.createdAt))}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {form.settings.assignmentMode &&
                            response.totalScore !== undefined && (
                              <div className="text-right">
                                {getGradeBadge(
                                  response.totalScore,
                                  response.maxScore || 0
                                )}
                              </div>
                            )}
                          {response.timeSpent && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {Math.round(response.timeSpent / 60)}m
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Responses Tab */}
          <TabsContent value="responses" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Search responses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date">Date Range</Label>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Last Week</SelectItem>
                        <SelectItem value="month">Last Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="sort">Sort By</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        {form.settings.assignmentMode && (
                          <SelectItem value="score">Highest Score</SelectItem>
                        )}
                        <SelectItem value="email">Email A-Z</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                        setDateFilter("all");
                        setSortBy("newest");
                      }}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Responses Table */}
            <Card>
              <CardHeader>
                <CardTitle>Responses ({filteredResponses.length})</CardTitle>
                <CardDescription>
                  {filteredResponses.length !== responses.length &&
                    `Filtered from ${responses.length} total responses`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentResponses.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No responses found
                    </h3>
                    <p className="text-gray-600">
                      {filteredResponses.length === 0 && responses.length > 0
                        ? "Try adjusting your filters"
                        : "Share your form to start collecting responses"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-3 font-medium">Date</th>
                            <th className="text-left p-3 font-medium">
                              Status
                            </th>
                            {form.settings.collectEmail && (
                              <th className="text-left p-3 font-medium">
                                Email
                              </th>
                            )}
                            {form.settings.collectIP && (
                              <th className="text-left p-3 font-medium">IP</th>
                            )}
                            <th className="text-left p-3 font-medium">
                              Location
                            </th>
                            <th className="text-left p-3 font-medium">Time</th>
                            {form.settings.assignmentMode && (
                              <th className="text-left p-3 font-medium">
                                Score
                              </th>
                            )}
                            {form.fields.slice(0, 3).map((field) => (
                              <th
                                key={field.id}
                                className="text-left p-3 font-medium max-w-32 truncate"
                              >
                                {field.label}
                              </th>
                            ))}
                            <th className="text-left p-3 font-medium">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentResponses.map((response, index) => (
                            <tr
                              key={response._id}
                              className={
                                index % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }
                            >
                              <td className="p-3 text-sm">
                                {formatDate(new Date(response.createdAt))}
                              </td>
                              <td className="p-3">
                                {getStatusBadge(response.status)}
                              </td>
                              {form.settings.collectEmail && (
                                <td className="p-3 text-sm max-w-32 truncate">
                                  {response.submitterEmail || "-"}
                                </td>
                              )}
                              {form.settings.collectIP && (
                                <td className="p-3 text-sm font-mono">
                                  {response.submitterIp}
                                </td>
                              )}
                              <td className="p-3 text-sm">
                                {response.submitterLocation ? (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-gray-400" />
                                    <span className="truncate max-w-24">
                                      {response.submitterLocation.city ||
                                        response.submitterLocation.country ||
                                        "Unknown"}
                                    </span>
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {response.timeSpent ? (
                                  <Badge variant="outline" className="text-xs">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {Math.round(response.timeSpent / 60)}m
                                  </Badge>
                                ) : (
                                  "-"
                                )}
                              </td>
                              {form.settings.assignmentMode && (
                                <td className="p-3">
                                  {response.totalScore !== undefined
                                    ? getGradeBadge(
                                        response.totalScore,
                                        response.maxScore || 0
                                      )
                                    : "-"}
                                </td>
                              )}
                              {form.fields.slice(0, 3).map((field) => (
                                <td
                                  key={field.id}
                                  className="p-3 text-sm max-w-32"
                                >
                                  {renderFieldValue(field, response)}
                                </td>
                              ))}
                              <td className="p-3">
                                
                                <div className="flex items-center gap-2">
                                  <ResponseDetailModal
                                    response={response}
                                    formFields={form.fields}
                                    formTitle={form.title}
                                    assignmentMode={
                                      form.settings.assignmentMode
                                    }
                                    // onUpdate={handleUpdateResponse}
                                    onDelete={handleDeleteResponse}
                                    trigger={
                                      <Button variant="ghost" size="sm">
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    }
                                  />

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteResponse(response._id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-gray-600">
                          Showing {startIndex + 1} to{" "}
                          {Math.min(endIndex, filteredResponses.length)} of{" "}
                          {filteredResponses.length} responses
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(1, prev - 1))
                            }
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from(
                              { length: Math.min(5, totalPages) },
                              (_, i) => {
                                const pageNum = i + 1;
                                return (
                                  <Button
                                    key={pageNum}
                                    variant={
                                      currentPage === pageNum
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    onClick={() => setCurrentPage(pageNum)}
                                    className="w-8 h-8 p-0"
                                  >
                                    {pageNum}
                                  </Button>
                                );
                              }
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(totalPages, prev + 1)
                              )
                            }
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Field Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Field Analytics</CardTitle>
                <CardDescription>
                  Response statistics for each form field
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {analytics?.fieldAnalytics.map((fieldAnalytic) => (
                    <div
                      key={fieldAnalytic.fieldId}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">
                          {fieldAnalytic.fieldLabel}
                        </h4>
                        <Badge variant="outline">
                          {fieldAnalytic.responseCount} responses
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {fieldAnalytic.averageValue !== undefined && (
                          <div>
                            <span className="text-gray-600">
                              Average Value:
                            </span>
                            <span className="ml-2 font-medium">
                              {Math.round(fieldAnalytic.averageValue * 100) /
                                100}
                            </span>
                          </div>
                        )}

                        {fieldAnalytic.mostCommonAnswer && (
                          <div>
                            <span className="text-gray-600">Most Common:</span>
                            <span className="ml-2 font-medium truncate">
                              {fieldAnalytic.mostCommonAnswer}
                            </span>
                          </div>
                        )}

                        {fieldAnalytic.correctRate !== undefined && (
                          <div>
                            <span className="text-gray-600">Correct Rate:</span>
                            <span className="ml-2 font-medium">
                              {Math.round(fieldAnalytic.correctRate)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Response Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Response Timeline</CardTitle>
                <CardDescription>
                  Daily response submissions over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.responsesByDate.length ? (
                  <div className="space-y-2">
                    {analytics.responsesByDate.slice(-14).map((item) => (
                      <div
                        key={item.date}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="text-sm text-gray-600">
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  (item.count /
                                    Math.max(
                                      ...analytics.responsesByDate.map(
                                        (d) => d.count
                                      )
                                    )) *
                                  100
                                }%`,
                              }}
                            />
                          </div>

                          <span className="text-sm font-medium w-8 text-right">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No response data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Responses by location</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.responsesByLocation.length ? (
                  <div className="space-y-3">
                    {analytics.responsesByLocation.slice(0, 10).map((item) => (
                      <div
                        key={item.location}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{item.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  (item.count /
                                    analytics.responsesByLocation[0].count) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No location data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignment Mode Analytics */}
            {form.settings.assignmentMode && (
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Performance</CardTitle>
                  <CardDescription>
                    Score distribution and performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Score Distribution */}
                    <div>
                      <h4 className="font-medium mb-3">Score Distribution</h4>
                      <div className="space-y-2">
                        {[
                          "A (90-100%)",
                          "B (80-89%)",
                          "C (70-79%)",
                          "D (60-69%)",
                          "F (0-59%)",
                        ].map((grade, index) => {
                          const ranges = [
                            [90, 100],
                            [80, 89],
                            [70, 79],
                            [60, 69],
                            [0, 59],
                          ];
                          const [min, max] = ranges[index];
                          const count = responses.filter((r) => {
                            if (!r.totalScore || !r.maxScore) return false;
                            const percentage =
                              (r.totalScore / r.maxScore) * 100;
                            return percentage >= min && percentage <= max;
                          }).length;

                          const maxCount = Math.max(
                            ...ranges.map(
                              ([min, max]) =>
                                responses.filter((r) => {
                                  if (!r.totalScore || !r.maxScore)
                                    return false;
                                  const percentage =
                                    (r.totalScore / r.maxScore) * 100;
                                  return percentage >= min && percentage <= max;
                                }).length
                            )
                          );

                          return (
                            <div
                              key={grade}
                              className="flex items-center justify-between"
                            >
                              <span className="text-sm">{grade}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-purple-500 h-2 rounded-full"
                                    style={{
                                      width:
                                        maxCount > 0
                                          ? `${(count / maxCount) * 100}%`
                                          : "0%",
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-medium w-8 text-right">
                                  {count}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div>
                      <h4 className="font-medium mb-3">Performance Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Highest Score:
                          </span>
                          <span className="font-medium">
                            {Math.max(
                              ...responses.map((r) => r.totalScore || 0)
                            )}{" "}
                            / {responses[0]?.maxScore || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Lowest Score:
                          </span>
                          <span className="font-medium">
                            {Math.min(
                              ...responses.map((r) => r.totalScore || 0)
                            )}{" "}
                            / {responses[0]?.maxScore || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Pass Rate (≥70%):
                          </span>
                          <span className="font-medium">
                            {responses.length > 0
                              ? Math.round(
                                  (responses.filter((r) => {
                                    if (!r.totalScore || !r.maxScore)
                                      return false;
                                    return (
                                      (r.totalScore / r.maxScore) * 100 >= 70
                                    );
                                  }).length /
                                    responses.length) *
                                    100
                                )
                              : 0}
                            %
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Average Time:
                          </span>
                          <span className="font-medium">
                            {responses.length > 0
                              ? Math.round(
                                  responses.reduce(
                                    (sum, r) => sum + (r.timeSpent || 0),
                                    0
                                  ) /
                                    responses.length /
                                    60
                                )
                              : 0}{" "}
                            minutes
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Device & Browser Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Device & Browser Analytics</CardTitle>
                <CardDescription>
                  Response submission devices and browsers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Browser Distribution */}
                  <div>
                    <h4 className="font-medium mb-3">Browsers</h4>
                    <div className="space-y-2">
                      {Object.entries(
                        responses.reduce((acc, r) => {
                          const browser = r.deviceInfo?.browser || "Unknown";
                          acc[browser] = (acc[browser] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      )
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([browser, count]) => (
                          <div
                            key={browser}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm">{browser}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{
                                    width: `${
                                      (count / responses.length) * 100
                                    }%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium w-8 text-right">
                                {count}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Operating System Distribution */}
                  <div>
                    <h4 className="font-medium mb-3">Operating Systems</h4>
                    <div className="space-y-2">
                      {Object.entries(
                        responses.reduce((acc, r) => {
                          const os = r.deviceInfo?.os || "Unknown";
                          acc[os] = (acc[os] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      )
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([os, count]) => (
                          <div
                            key={os}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm">{os}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{
                                    width: `${
                                      (count / responses.length) * 100
                                    }%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium w-8 text-right">
                                {count}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>
                  Download your form responses and analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={exportToCSV}
                    disabled={responses.length === 0}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export as CSV
                  </Button>
                  <Button
                    onClick={exportToJSON}
                    disabled={responses.length === 0}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export as JSON
                  </Button>
                  <Button
                    onClick={() => {
                      // Generate PDF report
                      toast.info("PDF export coming soon!");
                    }}
                    disabled={responses.length === 0}
                    variant="outline"
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export PDF Report
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  CSV includes all response data. JSON includes structured data
                  with metadata. PDF provides a formatted analytics report.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
