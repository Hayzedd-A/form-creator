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

function formatStatusLabel(status: string) {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : status;
}

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

  // Calculate grade information for assignment mode. The badge variant only
  // needs to distinguish pass / borderline / fail — the percentage and
  // letter grade are always rendered as text alongside it, so the variant
  // is reinforcement, never the sole signal.
  const gradeInfo =
    assignmentMode &&
    response.totalScore !== undefined &&
    response.maxScore !== undefined
      ? (() => {
          const percentage = Math.round(
            (response.totalScore / response.maxScore) * 100
          );
          let letter = "F";

          if (percentage >= 90) {
            letter = "A";
          } else if (percentage >= 80) {
            letter = "B";
          } else if (percentage >= 70) {
            letter = "C";
          } else if (percentage >= 60) {
            letter = "D";
          }

          const variant: "default" | "secondary" | "destructive" =
            percentage >= 70
              ? "default"
              : percentage >= 60
              ? "secondary"
              : "destructive";

          return { percentage, letter, variant };
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
      return <span className="text-muted-foreground italic">No response</span>;
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
                    i < value
                      ? "text-primary fill-current"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
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
              <div className="text-xs text-muted-foreground">
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
              className="text-primary hover:underline text-sm flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              View File
              <ExternalLink className="w-3 h-3" />
            </a>
          );
        }
        return (
          <span className="text-muted-foreground italic">
            No file uploaded
          </span>
        );

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
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
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
        <div className="flex items-start justify-between pb-4 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Response Details
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Form: {formTitle}
            </p>
            {response.submitterEmail && (
              <p className="text-sm text-muted-foreground">
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
              {formatStatusLabel(response.status)}
            </Badge>
            {assignmentMode && gradeInfo && (
              <Badge variant={gradeInfo.variant}>
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
                                <span className="text-destructive text-xs">
                                  *
                                </span>
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
                              <p className="text-xs text-muted-foreground mb-2">
                                {field.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="bg-muted rounded-lg p-3">
                          <div className="text-xs text-muted-foreground mb-1">
                            Response:
                          </div>
                          {formatFieldValue(fieldResponse, field)}
                        </div>

                        {assignmentMode &&
                          field.correctAnswer !== undefined && (
                            <div className="border border-border rounded-lg p-3 space-y-2">
                              <div className="text-xs font-medium text-foreground">
                                Correct Answer:
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {Array.isArray(field.correctAnswer)
                                  ? field.correctAnswer.join(", ")
                                  : String(field.correctAnswer)}
                              </div>
                              {field.explanation && (
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-foreground">
                                    Explanation:
                                  </div>
                                  <p className="text-sm text-muted-foreground">
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
                    <span className="text-muted-foreground">Submitted:</span>
                    <span>{new Date(response.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge
                      variant={
                        response.status === "completed"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {formatStatusLabel(response.status)}
                    </Badge>
                  </div>
                  {response.timeSpent && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time Spent:</span>
                      <span>{formatDuration(response.timeSpent)}</span>
                    </div>
                  )}
                  {response.startedAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Started:</span>
                      <span>
                        {new Date(response.startedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {response.completedAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completed:</span>
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
                      <span className="text-muted-foreground">Email:</span>
                      <span className="truncate max-w-32">
                        {response.submitterEmail}
                      </span>
                    </div>
                  )}
                  {response.submitterIp && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IP Address:</span>
                      <span>{response.submitterIp}</span>
                    </div>
                  )}
                  {response.sessionId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Session ID:</span>
                      <span className="truncate max-w-32">
                        {response.sessionId}
                      </span>
                    </div>
                  )}
                  {response.referrer && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Referrer:</span>
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
                        <span className="text-muted-foreground">Country:</span>
                        <span>{response.submitterLocation.country}</span>
                      </div>
                    )}
                    {response.submitterLocation.city && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">City:</span>
                        <span>{response.submitterLocation.city}</span>
                      </div>
                    )}
                    {response.submitterLocation.region && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Region:</span>
                        <span>{response.submitterLocation.region}</span>
                      </div>
                    )}
                    {response.submitterLocation.timezone && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Timezone:</span>
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
                        <span className="text-muted-foreground">Device:</span>
                        <span>{response.deviceInfo.device}</span>
                      </div>
                    )}
                    {response.deviceInfo.browser && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Browser:</span>
                        <span>{response.deviceInfo.browser}</span>
                      </div>
                    )}
                    {response.deviceInfo.os && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">OS:</span>
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
                          <div className="text-3xl font-bold mb-2 text-foreground">
                            {response.totalScore}/{response.maxScore}
                          </div>
                          <div className="text-lg text-muted-foreground">
                            {gradeInfo?.percentage}% - Grade {gradeInfo?.letter}
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-200 ease-out ${
                              gradeInfo?.variant === "destructive"
                                ? "bg-destructive"
                                : "bg-primary"
                            }`}
                            style={{ width: `${gradeInfo?.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-muted-foreground text-center">
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
                      <div className="text-center text-muted-foreground">
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
                      <p className="text-xs text-muted-foreground mt-1">
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
                                ? "border-border bg-muted/30"
                                : "border-destructive bg-destructive/5"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-foreground flex items-center gap-2">
                                {isCorrect ? (
                                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-destructive shrink-0" />
                                )}
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
                                <span className="font-medium text-muted-foreground">
                                  Student Answer:
                                </span>
                                <div className="mt-1">
                                  {formatFieldValue(fieldResponse, field)}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">
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
                              <div className="mt-3 p-2 border border-border rounded">
                                <span className="font-medium text-foreground text-sm">
                                  Explanation:
                                </span>
                                <p className="text-muted-foreground text-sm mt-1">
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
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

