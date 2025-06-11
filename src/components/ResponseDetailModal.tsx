import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Clock,
  User,
  MapPin,
  Monitor,
  Smartphone,
  Globe,
  Award,
  Edit,
  Download,
  Copy,
  FileText,
  Flag,
  MessageSquare,
  ExternalLink,
  Trash2,
  BarChart3,
  CheckCircle2,
  XCircle,
  Star,
  Eye,
} from "lucide-react";
import { formatDuration } from "@/lib/analytics";
import { 
  handlePrintResponse, 
  handlePrintResponseAlternative, 
  handlePrintResponseInline 
} from "@/utils/printResponse";

interface ResponseDetailModalProps {
  response: any;
  formFields: any[];
  formTitle: string;
  assignmentMode?: boolean;
  onUpdate?: (responseId: string, updates: any) => Promise<void>;
  onDelete?: (responseId: string) => Promise<void>;
  trigger: React.ReactNode;
}

export default function ResponseDetailModal({
  response,
  formFields,
  formTitle,
  assignmentMode = false,
  onUpdate,
  onDelete,
  trigger,
}: ResponseDetailModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [manualGrade, setManualGrade] = useState(
    response.manualGrade?.toString() || ""
  );
  const [adminNotes, setAdminNotes] = useState(response.adminNotes || "");
  const [isUpdating, setIsUpdating] = useState(false);

  // Calculate grade information for assignment mode
  const gradeInfo =
    assignmentMode &&
    response.totalScore !== undefined &&
    response.maxScore !== undefined
      ? (() => {
          const percentage = Math.round(
            (response.totalScore / response.maxScore) * 100
          );
          let letter = "F";
          let color = "red";

          if (percentage >= 90) {
            letter = "A";
            color = "green";
          } else if (percentage >= 80) {
            letter = "B";
            color = "blue";
          } else if (percentage >= 70) {
            letter = "C";
            color = "yellow";
          } else if (percentage >= 60) {
            letter = "D";
            color = "orange";
          }

          return { percentage, letter, color };
        })()
      : null;

  const handleUpdateResponse = async () => {
    if (!onUpdate) return;

    setIsUpdating(true);
    try {
      const updates: any = {
        adminNotes: adminNotes.trim() || undefined,
      };

      if (manualGrade && !isNaN(Number(manualGrade))) {
        updates.manualGrade = Number(manualGrade);
      }

      await onUpdate(response._id, updates);
      toast.success("Response updated successfully");
    } catch (error) {
      toast.error("Failed to update response");
      console.error("Update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteResponse = async () => {
    if (!onDelete) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this response? This action cannot be undone."
    );

    if (confirmed) {
      try {
        await onDelete(response._id);
        toast.success("Response deleted successfully");
        setIsOpen(false);
      } catch (error) {
        toast.error("Failed to delete response");
        console.error("Delete error:", error);
      }
    }
  };

  const copyResponseData = () => {
    const responseData = {
      formTitle,
      response,
      submittedAt: new Date(response.createdAt).toISOString(),
    };

    navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
    toast.success("Response data copied to clipboard");
  };

  const formatFieldValue = (fieldResponse: any, field: any) => {
    if (
      !fieldResponse ||
      fieldResponse.value === null ||
      fieldResponse.value === undefined
    ) {
      return <span className="text-gray-400 italic">No response</span>;
    }

    const value = fieldResponse.value;

    switch (field?.type) {
      case "multiple-choice":
      case "checkbox":
        if (Array.isArray(value)) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((item: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          );
        }
        return (
          <Badge variant="secondary" className="text-xs">
            {value}
          </Badge>
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
          </div>
        );

      case "linear-scale":
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {value} / {field.maxScale || 10}
            </div>
            {field.scaleLabels && (
              <div className="text-xs text-gray-500">
                {field.scaleLabels.min} - {field.scaleLabels.max}
              </div>
            )}
          </div>
        );

      case "yes-no":
        return (
          <Badge
            variant={value === "yes" ? "default" : "secondary"}
            className="text-xs"
          >
            {value === "yes" ? "Yes" : "No"}
          </Badge>
        );

      case "date":
      case "datetime":
        return (
          <span className="text-sm">
            {new Date(value).toLocaleDateString()}
          </span>
        );

      case "file-upload":
        if (fieldResponse.fileUrl) {
          return (
            <a
              href={fieldResponse.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
            >
              📎 View File
              <ExternalLink className="w-3 h-3" />
            </a>
          );
        }
        return <span className="text-gray-400 italic">No file uploaded</span>;

      case "address":
        if (typeof value === "object" && value !== null) {
          const parts = [
            value.street,
            value.city,
            value.state,
            value.zip,
            value.country,
          ].filter(Boolean);
          return <span className="text-sm">{parts.join(", ")}</span>;
        }
        return <span className="text-sm">{String(value)}</span>;

      default:
        if (typeof value === "object") {
          return (
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(value, null, 2)}
            </pre>
          );
        }
        return <span className="text-sm break-words">{String(value)}</span>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">Response Details</h2>
            <p className="text-sm text-gray-600 mt-1">Form: {formTitle}</p>
            {response.submitterEmail && (
              <p className="text-sm text-gray-600">
                From: {response.submitterEmail}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                response.status === "completed" ? "default" : "secondary"
              }
            >
              {response.status}
            </Badge>
            {assignmentMode && gradeInfo && (
              <Badge
                variant="outline"
                className={`text-${gradeInfo.color}-600`}
              >
                {gradeInfo.percentage}% ({gradeInfo.letter})
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="responses" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="responses">Responses</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            {assignmentMode && (
              <TabsTrigger value="grading">Grading</TabsTrigger>
            )}
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          {/* Responses Tab */}
          <TabsContent value="responses" className="space-y-4">
            <div className="space-y-4">
              {formFields.map((field) => {
                const fieldResponse = response.responses.find(
                  (r: any) => r.fieldId === field.id
                );
                const isCorrect = assignmentMode
                  ? fieldResponse?.isCorrect
                  : undefined;

                return (
                  <Card key={field.id}>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-sm">
                                {field.label}
                              </h4>
                              {field.required && (
                                <span className="text-red-500 text-xs">*</span>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {field.type}
                              </Badge>
                              {assignmentMode && isCorrect !== undefined && (
                                <Badge
                                  variant={
                                    isCorrect ? "default" : "destructive"
                                  }
                                  className="text-xs"
                                >
                                  {isCorrect ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Correct
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Incorrect
                                    </>
                                  )}
                                </Badge>
                              )}
                            </div>
                            {field.description && (
                              <p className="text-xs text-gray-500 mb-2">
                                {field.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">
                            Response:
                          </div>
                          {formatFieldValue(fieldResponse, field)}
                        </div>

                        {assignmentMode &&
                          field.correctAnswer !== undefined && (
                            <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                              <div className="text-xs font-medium text-blue-900">
                                Correct Answer:
                              </div>
                              <div className="text-sm text-blue-800">
                                {Array.isArray(field.correctAnswer)
                                  ? field.correctAnswer.join(", ")
                                  : String(field.correctAnswer)}
                              </div>
                              {field.explanation && (
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-blue-900">
                                    Explanation:
                                  </div>
                                  <p className="text-sm text-blue-800">
                                    {field.explanation}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Submission Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="w-4 h-4" />
                    Submission Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Submitted:</span>
                    <span>{new Date(response.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <Badge
                      variant={
                        response.status === "completed"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {response.status}
                    </Badge>
                  </div>
                  {response.timeSpent && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Time Spent:</span>
                      <span>{formatDuration(response.timeSpent)}</span>
                    </div>
                  )}
                  {response.startedAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Started:</span>
                      <span>
                        {new Date(response.startedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {response.completedAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Completed:</span>
                      <span>
                        {new Date(response.completedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="w-4 h-4" />
                    User Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {response.submitterEmail && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Email:</span>
                      <span className="truncate max-w-32">
                        {response.submitterEmail}
                      </span>
                    </div>
                  )}
                  {response.submitterIp && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IP Address:</span>
                      <span>{response.submitterIp}</span>
                    </div>
                  )}
                  {response.sessionId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Session ID:</span>
                      <span className="truncate max-w-32">
                        {response.sessionId}
                      </span>
                    </div>
                  )}
                  {response.referrer && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Referrer:</span>
                      <span className="truncate max-w-32">
                        {response.referrer}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Location Info */}
              {response.submitterLocation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MapPin className="w-4 h-4" />
                      Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {response.submitterLocation.country && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Country:</span>
                        <span>{response.submitterLocation.country}</span>
                      </div>
                    )}
                    {response.submitterLocation.city && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">City:</span>
                        <span>{response.submitterLocation.city}</span>
                      </div>
                    )}
                    {response.submitterLocation.region && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Region:</span>
                        <span>{response.submitterLocation.region}</span>
                      </div>
                    )}
                    {response.submitterLocation.timezone && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Timezone:</span>
                        <span>{response.submitterLocation.timezone}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Device Info */}
              {response.deviceInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {response.deviceInfo.device === "Mobile" ? (
                        <Smartphone className="w-4 h-4" />
                      ) : (
                        <Monitor className="w-4 h-4" />
                      )}
                      Device Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {response.deviceInfo.device && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Device:</span>
                        <span>{response.deviceInfo.device}</span>
                      </div>
                    )}
                    {response.deviceInfo.browser && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Browser:</span>
                        <span>{response.deviceInfo.browser}</span>
                      </div>
                    )}
                    {response.deviceInfo.os && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">OS:</span>
                        <span>{response.deviceInfo.os}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Grading Tab (Assignment Mode) */}
          {assignmentMode && (
            <TabsContent value="grading" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Automatic Scoring */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Automatic Scoring
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {response.totalScore !== undefined &&
                    response.maxScore !== undefined ? (
                      <>
                        <div className="text-center">
                          <div className="text-3xl font-bold mb-2">
                            {response.totalScore}/{response.maxScore}
                          </div>
                          <div className="text-lg text-gray-600">
                            {gradeInfo?.percentage}% - Grade {gradeInfo?.letter}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              gradeInfo?.color === "green"
                                ? "bg-green-500"
                                : gradeInfo?.color === "blue"
                                ? "bg-blue-500"
                                : gradeInfo?.color === "yellow"
                                ? "bg-yellow-500"
                                : gradeInfo?.color === "orange"
                                ? "bg-orange-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${gradeInfo?.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-gray-600 text-center">
                          {
                            response.responses.filter((r: any) => r.isCorrect)
                              .length
                          }{" "}
                          correct out of{" "}
                          {
                            formFields.filter(
                              (f) => f.correctAnswer !== undefined
                            ).length
                          }{" "}
                          questions
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-gray-500">
                        No automatic scoring available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Manual Grading */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Manual Grading
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="manualGrade">Manual Grade Override</Label>
                      <Input
                        id="manualGrade"
                        type="number"
                        value={manualGrade}
                        onChange={(e) => setManualGrade(e.target.value)}
                        placeholder="Enter manual grade"
                        min="0"
                        max={response.maxScore || 100}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Override the automatic score with a manual grade
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="adminNotes">Admin Notes</Label>
                      <Textarea
                        id="adminNotes"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes about this response..."
                        rows={4}
                      />
                    </div>

                    <Button
                      onClick={handleUpdateResponse}
                      disabled={isUpdating}
                      className="w-full"
                    >
                      {isUpdating ? "Updating..." : "Save Changes"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Question-by-Question Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Question Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {formFields
                      .filter((field) => field.correctAnswer !== undefined)
                      .map((field, index) => {
                        const fieldResponse = response.responses.find(
                          (r: any) => r.fieldId === field.id
                        );
                        const isCorrect = fieldResponse?.isCorrect;

                        return (
                          <div
                            key={field.id}
                            className={`p-4 rounded-lg border-l-4 ${
                              isCorrect
                                ? "border-green-500 bg-green-50"
                                : "border-red-500 bg-red-50"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium">
                                Question {index + 1}: {field.label}
                              </h4>
                              <Badge
                                variant={isCorrect ? "default" : "destructive"}
                                className="ml-2"
                              >
                                {isCorrect ? "Correct" : "Incorrect"}
                              </Badge>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">
                                  Student Answer:
                                </span>
                                <div className="mt-1">
                                  {formatFieldValue(fieldResponse, field)}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">
                                  Correct Answer:
                                </span>
                                <div className="mt-1">
                                  {Array.isArray(field.correctAnswer)
                                    ? field.correctAnswer.join(", ")
                                    : String(field.correctAnswer)}
                                </div>
                              </div>
                            </div>
                            {field.explanation && (
                              <div className="mt-3 p-2 bg-blue-50 rounded">
                                <span className="font-medium text-blue-900 text-sm">
                                  Explanation:
                                </span>
                                <p className="text-blue-800 text-sm mt-1">
                                  {field.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export & Copy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={copyResponseData}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Response Data
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      const dataStr = JSON.stringify(
                        {
                          formTitle,
                          response,
                          submittedAt: new Date(
                            response.createdAt
                          ).toISOString(),
                        },
                        null,
                        2
                      );
                      const dataBlob = new Blob([dataStr], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `response-${response._id}.json`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download as JSON
                  </Button>

                  {/* Print Button with multiple options */}
                  <div className="space-y-2">
                    {/* <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() =>
                        handlePrintResponse(
                          response,
                          assignmentMode,
                          formTitle,
                          formFields
                        )
                      }
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Print Response (New Window)
                    </Button> */}

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() =>
                        handlePrintResponseInline(
                          response,
                          assignmentMode,
                          formTitle,
                          formFields
                        )
                      }
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Print Response
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Management Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flag className="w-4 h-4" />
                    Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      const subject = `Response Follow-up: ${formTitle}`;
                      const body = `Hello,\n\nThank you for your response to "${formTitle}". We wanted to follow up with you regarding your submission.\n\nResponse ID: ${
                        response._id
                      }\nSubmitted: ${new Date(
                        response.createdAt
                      ).toLocaleString()}\n\nBest regards`;
                      const mailtoLink = `mailto:${
                        response.submitterEmail
                      }?subject=${encodeURIComponent(
                        subject
                      )}&body=${encodeURIComponent(body)}`;
                      window.open(mailtoLink);
                    }}
                    disabled={!response.submitterEmail}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Email Respondent
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      const url = `${window.location.origin}/forms/${formTitle
                        .toLowerCase()
                        .replace(/\s+/g, "-")}/responses/${response._id}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Response URL copied to clipboard");
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Copy Response URL
                  </Button>

                  <Separator className="my-3" />

                  {onDelete && (
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      onClick={handleDeleteResponse}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Response
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Admin Notes Display (if not in assignment mode) */}
              {!assignmentMode && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Admin Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this response..."
                      rows={4}
                    />
                    <Button
                      onClick={handleUpdateResponse}
                      disabled={isUpdating}
                      size="sm"
                    >
                      {isUpdating ? "Updating..." : "Save Notes"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer with quick actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>
              Submitted {new Date(response.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
            {onUpdate && (
              <Button
                onClick={handleUpdateResponse}
                disabled={isUpdating}
                size="sm"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

