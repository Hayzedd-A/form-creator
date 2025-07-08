// "use client";

// import { useState } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Separator } from "@/components/ui/separator";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Input } from "@/components/ui/input";
// import {
//   Eye,
//   User,
//   MapPin,
//   Monitor,
//   Clock,
//   Calendar,
//   CheckCircle,
//   XCircle,
//   Star,
//   FileText,
//   Download,
//   Edit,
//   Trash2,
//   Flag,
//   MessageSquare,
//   Globe,
//   Smartphone,
//   Award,
//   BarChart3,
//   Copy,
//   ExternalLink,
// } from "lucide-react";
// import { toast } from "sonner";

// interface FormField {
//   id: string;
//   type: string;
//   label: string;
//   required: boolean;
//   options?: string[];
//   correctAnswer?: any;
//   explanation?: string;
//   points?: number;
// }

// interface ResponseField {
//   fieldId: string;
//   value: any;
//   fileUrl?: string;
//   isCorrect?: boolean;
// }

// interface DeviceInfo {
//   browser?: string;
//   os?: string;
//   device?: string;
//   userAgent?: string;
// }

// interface LocationInfo {
//   country?: string;
//   city?: string;
//   region?: string;
//   timezone?: string;
//   coordinates?: {
//     lat: number;
//     lng: number;
//   };
// }

// interface FormResponse {
//   _id: string;
//   formId: string;
//   responses: ResponseField[];
//   submitterEmail?: string;
//   submitterIp: string;
//   submitterLocation?: LocationInfo;
//   deviceInfo?: DeviceInfo;
//   status: "draft" | "partial" | "completed";
//   timeSpent?: number;
//   startedAt?: string;
//   completedAt?: string;
//   totalScore?: number;
//   maxScore?: number;
//   manualGrade?: number;
//   adminNotes?: string;
//   referrer?: string;
//   sessionId?: string;
//   createdAt: string;
//   updatedAt: string;
// }

// interface ResponseDetailModalProps {
//   response: FormResponse;
//   formFields: FormField[];
//   formTitle: string;
//   assignmentMode?: boolean;
//   onUpdate?: (responseId: string, updates: any) => void;
//   onDelete?: (responseId: string) => void;
//   trigger?: React.ReactNode;
// }

// export default function ResponseDetailModal({
//   response,
//   formFields,
//   formTitle,
//   assignmentMode = false,
//   onUpdate,
//   onDelete,
//   trigger,
// }: ResponseDetailModalProps) {
//   const [isOpen, setIsOpen] = useState(false);
//   const [adminNotes, setAdminNotes] = useState(response.adminNotes || "");
//   const [manualGrade, setManualGrade] = useState(response.manualGrade || "");
//   const [isUpdating, setIsUpdating] = useState(false);
//   const [showPrintPreview, setShowPrintPreview] = useState(false);

//   const formatDuration = (seconds?: number) => {
//     if (!seconds) return "N/A";
//     if (seconds < 60) return `${seconds}s`;
//     const minutes = Math.floor(seconds / 60);
//     const remainingSeconds = seconds % 60;
//     if (minutes < 60) {
//       return remainingSeconds > 0
//         ? `${minutes}m ${remainingSeconds}s`
//         : `${minutes}m`;
//     }
//     const hours = Math.floor(minutes / 60);
//     const remainingMinutes = minutes % 60;
//     return `${hours}h ${remainingMinutes}m`;
//   };

//   const getGradeInfo = (score?: number, maxScore?: number) => {
//     if (score === undefined || maxScore === undefined || maxScore === 0) {
//       return { percentage: 0, letter: "N/A", color: "gray" };
//     }

//     const percentage = Math.round((score / maxScore) * 100);
//     let letter = "F";
//     let color = "red";

//     if (percentage >= 90) {
//       letter = "A";
//       color = "green";
//     } else if (percentage >= 80) {
//       letter = "B";
//       color = "blue";
//     } else if (percentage >= 70) {
//       letter = "C";
//       color = "yellow";
//     } else if (percentage >= 60) {
//       letter = "D";
//       color = "orange";
//     }

//     return { percentage, letter, color };
//   };

//   const renderFieldValue = (field: FormField, responseField: ResponseField) => {
//     const { value } = responseField;

//     if (value === null || value === undefined || value === "") {
//       return <span className="text-gray-400 italic">No response</span>;
//     }

//     switch (field.type) {
//       case "multiple-choice":
//       case "checkbox":
//         if (Array.isArray(value)) {
//           return (
//             <div className="flex flex-wrap gap-1">
//               {value.map((item, index) => (
//                 <Badge key={index} variant="secondary">
//                   {item}
//                 </Badge>
//               ))}
//             </div>
//           );
//         }
//         return <Badge variant="secondary">{value}</Badge>;

//       case "rating":
//         const rating = Number(value);
//         const maxRating = field.maxRating || 5;
//         return (
//           <div className="flex items-center gap-1">
//             {Array.from({ length: maxRating }, (_, i) => (
//               <Star
//                 key={i}
//                 className={`w-4 h-4 ${
//                   i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
//                 }`}
//               />
//             ))}
//             <span className="ml-2 text-sm text-gray-600">
//               {rating}/{maxRating}
//             </span>
//           </div>
//         );

//       case "linear-scale":
//         return (
//           <div className="flex items-center gap-2">
//             <Badge variant="outline">{value}</Badge>
//             <span className="text-sm text-gray-600">
//               (Scale: {field.minScale || 1} - {field.maxScale || 10})
//             </span>
//           </div>
//         );

//       case "yes-no":
//         return (
//           <Badge variant={value === "yes" ? "default" : "secondary"}>
//             {value === "yes" ? "Yes" : "No"}
//           </Badge>
//         );

//       case "file-upload":
//         if (responseField.fileUrl) {
//           return (
//             <div className="flex items-center gap-2">
//               <FileText className="w-4 h-4" />
//               <a
//                 href={responseField.fileUrl}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="text-blue-600 hover:underline"
//               >
//                 View File
//               </a>
//               <Button size="sm" variant="ghost">
//                 <Download className="w-4 h-4" />
//               </Button>
//             </div>
//           );
//         }
//         return <span className="text-gray-600">{value}</span>;

//       case "address":
//         if (typeof value === "object") {
//           return (
//             <div className="text-sm space-y-1">
//               <div>{value.street}</div>
//               <div>
//                 {value.city}, {value.state} {value.postalCode}
//               </div>
//               <div>{value.country}</div>
//             </div>
//           );
//         }
//         return <span>{value}</span>;

//       case "date":
//       case "datetime":
//         return (
//           <div className="flex items-center gap-2">
//             <Calendar className="w-4 h-4" />
//             {new Date(value).toLocaleDateString()}
//           </div>
//         );

//       default:
//         return <span className="break-words">{value}</span>;
//     }
//   };

//   const handleUpdateResponse = async () => {
//     if (!onUpdate) return;

//     setIsUpdating(true);
//     try {
//       await onUpdate(response._id, {
//         adminNotes,
//         manualGrade: manualGrade ? Number(manualGrade) : undefined,
//       });
//       toast.success("Response updated successfully");
//     } catch (error) {
//       toast.error("Failed to update response");
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   const handleDeleteResponse = async () => {
//     if (!onDelete) return;

//     if (
//       confirm(
//         "Are you sure you want to delete this response? This action cannot be undone."
//       )
//     ) {
//       try {
//         await onDelete(response._id);
//         toast.success("Response deleted successfully");
//         setIsOpen(false);
//       } catch (error) {
//         toast.error("Failed to delete response");
//       }
//     }
//   };

//   const copyResponseData = () => {
//     const responseData = {
//       submissionId: response._id,
//       submittedAt: response.createdAt,
//       responses: response.responses?.map((r) => {
//         const field = formFields.find((f) => f.id === r.fieldId);
//         return {
//           question: field?.label,
//           answer: r.value,
//         };
//       }),
//     };

//     navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
//     toast.success("Response data copied to clipboard");
//   };

//   const gradeInfo = getGradeInfo(
//     response.manualGrade || response.totalScore,
//     response.maxScore
//   );

//   return (
//     <Dialog open={isOpen} onOpenChange={setIsOpen}>
//       <DialogTrigger asChild>
//         {trigger || (
//           <Button variant="ghost" size="sm">
//             <Eye className="w-4 h-4" />
//           </Button>
//         )}
//       </DialogTrigger>
//       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <div className="flex items-center justify-between">
//             <DialogTitle className="flex items-center gap-2">
//               <FileText className="w-5 h-5" />
//               Response Details
//             </DialogTitle>
//             <div className="flex items-center gap-2">
//               <Badge
//                 variant={
//                   response.status === "completed"
//                     ? "default"
//                     : response.status === "partial"
//                     ? "secondary"
//                     : "outline"
//                 }
//               >
//                 {response.status}
//               </Badge>
//               {assignmentMode && response.totalScore !== undefined && (
//                 <Badge
//                   variant="outline"
//                   className={`text-${gradeInfo.color}-600 border-${gradeInfo.color}-300`}
//                 >
//                   {gradeInfo.letter} ({gradeInfo.percentage}%)
//                 </Badge>
//               )}
//             </div>
//           </div>
//         </DialogHeader>

//         <Tabs defaultValue="responses" className="w-full">
//           <TabsList className="grid w-full grid-cols-4">
//             <TabsTrigger value="responses">Responses</TabsTrigger>
//             <TabsTrigger value="details">Details</TabsTrigger>
//             {assignmentMode && (
//               <TabsTrigger value="grading">Grading</TabsTrigger>
//             )}
//             <TabsTrigger value="actions">Actions</TabsTrigger>
//           </TabsList>

//           {/* Responses Tab */}
//           <TabsContent value="responses" className="space-y-4">
//             <Card>
//               <CardHeader>
//                 <CardTitle className="text-lg">Form Responses</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 {formFields.map((field) => {
//                   const responseField = response.responses?.find(
//                     (r) => r.fieldId === field.id
//                   );

//                   return (
//                     <div
//                       key={field.id}
//                       className="border-b pb-4 last:border-b-0"
//                     >
//                       <div className="flex items-start justify-between mb-2">
//                         <div className="flex-1">
//                           <Label className="font-medium text-base">
//                             {field.label}
//                             {field.required && (
//                               <span className="text-red-500 ml-1">*</span>
//                             )}
//                           </Label>
//                           {field.type && (
//                             <Badge variant="outline" className="ml-2 text-xs">
//                               {field.type.replace("-", " ")}
//                             </Badge>
//                           )}
//                         </div>
//                         {assignmentMode &&
//                           responseField?.isCorrect !== undefined && (
//                             <div className="flex items-center gap-1">
//                               {responseField.isCorrect ? (
//                                 <CheckCircle className="w-5 h-5 text-green-500" />
//                               ) : (
//                                 <XCircle className="w-5 h-5 text-red-500" />
//                               )}
//                             </div>
//                           )}
//                       </div>

//                       <div className="ml-4">
//                         {responseField ? (
//                           renderFieldValue(field, responseField)
//                         ) : (
//                           <span className="text-gray-400 italic">
//                             No response
//                           </span>
//                         )}
//                       </div>

//                       {assignmentMode && field.correctAnswer && (
//                         <div className="mt-2 ml-4 p-3 bg-gray-50 rounded-lg">
//                           <div className="text-sm">
//                             <span className="font-medium text-green-700">
//                               Correct Answer:
//                             </span>
//                             <span className="ml-2">
//                               {Array.isArray(field.correctAnswer)
//                                 ? field.correctAnswer.join(", ")
//                                 : field.correctAnswer}
//                             </span>
//                           </div>
//                           {field.explanation && (
//                             <div className="text-sm mt-1">
//                               <span className="font-medium text-blue-700">
//                                 Explanation:
//                               </span>
//                               <span className="ml-2">{field.explanation}</span>
//                             </div>
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </CardContent>
//             </Card>
//           </TabsContent>

//           {/* Details Tab */}
//           <TabsContent value="details" className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {/* Submission Info */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2">
//                     <Calendar className="w-4 h-4" />
//                     Submission Info
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-3">
//                   <div>
//                     <Label className="text-sm font-medium">Submitted At</Label>
//                     <p className="text-sm">
//                       {new Date(response.createdAt).toLocaleString()}
//                     </p>
//                   </div>
//                   {response.startedAt && (
//                     <div>
//                       <Label className="text-sm font-medium">Started At</Label>
//                       <p className="text-sm">
//                         {new Date(response.startedAt).toLocaleString()}
//                       </p>
//                     </div>
//                   )}
//                   {response.completedAt && (
//                     <div>
//                       <Label className="text-sm font-medium">
//                         Completed At
//                       </Label>
//                       <p className="text-sm">
//                         {new Date(response.completedAt).toLocaleString()}
//                       </p>
//                     </div>
//                   )}
//                   <div>
//                     <Label className="text-sm font-medium">Time Spent</Label>
//                     <p className="text-sm flex items-center gap-1">
//                       <Clock className="w-4 h-4" />
//                       {formatDuration(response.timeSpent)}
//                     </p>
//                   </div>
//                   <div>
//                     <Label className="text-sm font-medium">Session ID</Label>
//                     <p className="text-sm font-mono text-xs">
//                       {response.sessionId || "N/A"}
//                     </p>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* User Info */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2">
//                     <User className="w-4 h-4" />
//                     User Info
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-3">
//                   <div>
//                     <Label className="text-sm font-medium">Email</Label>
//                     <p className="text-sm">
//                       {response.submitterEmail || "Anonymous"}
//                     </p>
//                   </div>
//                   <div>
//                     <Label className="text-sm font-medium">IP Address</Label>
//                     <p className="text-sm font-mono">{response.submitterIp}</p>
//                   </div>
//                   {response.referrer && (
//                     <div>
//                       <Label className="text-sm font-medium">Referrer</Label>
//                       <p className="text-sm break-all">{response.referrer}</p>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>

//               {/* Location Info */}
//               {response.submitterLocation && (
//                 <Card>
//                   <CardHeader>
//                     <CardTitle className="flex items-center gap-2">
//                       <MapPin className="w-4 h-4" />
//                       Location
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-3">
//                     <div>
//                       <Label className="text-sm font-medium">Country</Label>
//                       <p className="text-sm">
//                         {response.submitterLocation.country || "Unknown"}
//                       </p>
//                     </div>
//                     <div>
//                       <Label className="text-sm font-medium">City</Label>
//                       <p className="text-sm">
//                         {response.submitterLocation.city || "Unknown"}
//                       </p>
//                     </div>
//                     <div>
//                       <Label className="text-sm font-medium">Region</Label>
//                       <p className="text-sm">
//                         {response.submitterLocation.region || "Unknown"}
//                       </p>
//                     </div>
//                     <div>
//                       <Label className="text-sm font-medium">Timezone</Label>
//                       <p className="text-sm">
//                         {response.submitterLocation.timezone || "Unknown"}
//                       </p>
//                     </div>
//                     {response.submitterLocation.coordinates && (
//                       <div>
//                         <Label className="text-sm font-medium">
//                           Coordinates
//                         </Label>
//                         <p className="text-sm font-mono">
//                           {response.submitterLocation.coordinates.lat.toFixed(
//                             4
//                           )}
//                           ,{" "}
//                           {response.submitterLocation.coordinates.lng.toFixed(
//                             4
//                           )}
//                         </p>
//                       </div>
//                     )}
//                   </CardContent>
//                 </Card>
//               )}

//               {/* Device Info */}
//               {response.deviceInfo && (
//                 <Card>
//                   <CardHeader>
//                     <CardTitle className="flex items-center gap-2">
//                       <Monitor className="w-4 h-4" />
//                       Device Info
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-3">
//                     <div>
//                       <Label className="text-sm font-medium">Browser</Label>
//                       <p className="text-sm flex items-center gap-1">
//                         <Globe className="w-4 h-4" />
//                         {response.deviceInfo.browser || "Unknown"}
//                       </p>
//                     </div>
//                     <div>
//                       <Label className="text-sm font-medium">
//                         Operating System
//                       </Label>
//                       <p className="text-sm">
//                         {response.deviceInfo.os || "Unknown"}
//                       </p>
//                     </div>
//                     <div>
//                       <Label className="text-sm font-medium">Device Type</Label>
//                       <p className="text-sm flex items-center gap-1">
//                         {response.deviceInfo.device === "Mobile" ? (
//                           <Smartphone className="w-4 h-4" />
//                         ) : (
//                           <Monitor className="w-4 h-4" />
//                         )}
//                         {response.deviceInfo.device || "Unknown"}
//                       </p>
//                     </div>
//                     {response.deviceInfo.userAgent && (
//                       <div>
//                         <Label className="text-sm font-medium">
//                           User Agent
//                         </Label>
//                         <p className="text-xs font-mono break-all bg-gray-50 p-2 rounded">
//                           {response.deviceInfo.userAgent}
//                         </p>
//                       </div>
//                     )}
//                   </CardContent>
//                 </Card>
//               )}
//             </div>
//           </TabsContent>

//           {/* Grading Tab */}
//           {assignmentMode && (
//             <TabsContent value="grading" className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {/* Score Overview */}
//                 <Card>
//                   <CardHeader>
//                     <CardTitle className="flex items-center gap-2">
//                       <Award className="w-4 h-4" />
//                       Score Overview
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-4">
//                     {response.totalScore !== undefined &&
//                       response.maxScore !== undefined && (
//                         <div className="text-center">
//                           <div className="text-3xl font-bold mb-2">
//                             <span className={`text-${gradeInfo.color}-600`}>
//                               {gradeInfo.percentage}%
//                             </span>
//                           </div>
//                           <div className="text-lg font-medium mb-2">
//                             Grade: {gradeInfo.letter}
//                           </div>
//                           <div className="text-sm text-gray-600">
//                             {response.totalScore} out of {response.maxScore}{" "}
//                             points
//                           </div>
//                           <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
//                             <div
//                               className={`bg-${gradeInfo.color}-500 h-2 rounded-full transition-all duration-300`}
//                               style={{ width: `${gradeInfo.percentage}%` }}
//                             ></div>
//                           </div>
//                         </div>
//                       )}

//                     {response.manualGrade !== undefined && (
//                       <div className="border-t pt-4">
//                         <Label className="text-sm font-medium">
//                           Manual Grade Override
//                         </Label>
//                         <p className="text-lg font-bold text-blue-600">
//                           {response.manualGrade}%
//                         </p>
//                       </div>
//                     )}
//                   </CardContent>
//                 </Card>

//                 {/* Question Breakdown */}
//                 <Card>
//                   <CardHeader>
//                     <CardTitle className="flex items-center gap-2">
//                       <BarChart3 className="w-4 h-4" />
//                       Question Breakdown
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="space-y-3">
//                       {formFields
//                         .filter((field) => field.correctAnswer !== undefined)
//                         .map((field) => {
//                           const responseField = response.responses?.find(
//                             (r) => r.fieldId === field.id
//                           );
//                           const isCorrect = responseField?.isCorrect;
//                           const points = field.points || 1;

//                           return (
//                             <div
//                               key={field.id}
//                               className="flex items-center justify-between p-2 rounded border"
//                             >
//                               <div className="flex items-center gap-2">
//                                 {isCorrect ? (
//                                   <CheckCircle className="w-4 h-4 text-green-500" />
//                                 ) : (
//                                   <XCircle className="w-4 h-4 text-red-500" />
//                                 )}
//                                 <span className="text-sm font-medium truncate max-w-[200px]">
//                                   {field.label}
//                                 </span>
//                               </div>
//                               <div className="text-sm">
//                                 <span
//                                   className={
//                                     isCorrect
//                                       ? "text-green-600"
//                                       : "text-red-600"
//                                   }
//                                 >
//                                   {isCorrect ? points : 0}/{points}
//                                 </span>
//                               </div>
//                             </div>
//                           );
//                         })}
//                     </div>
//                   </CardContent>
//                 </Card>

//                 {/* Manual Grading */}
//                 <Card className="md:col-span-2">
//                   <CardHeader>
//                     <CardTitle className="flex items-center gap-2">
//                       <Edit className="w-4 h-4" />
//                       Manual Grading & Notes
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-4">
//                     <div>
//                       <Label htmlFor="manualGrade">
//                         Manual Grade Override (%)
//                       </Label>
//                       <Input
//                         id="manualGrade"
//                         type="number"
//                         min="0"
//                         max="100"
//                         value={manualGrade}
//                         onChange={(e) => setManualGrade(e.target.value)}
//                         placeholder="Enter grade percentage"
//                       />
//                       <p className="text-xs text-gray-500 mt-1">
//                         Leave empty to use automatic scoring
//                       </p>
//                     </div>

//                     <div>
//                       <Label htmlFor="adminNotes">Admin Notes</Label>
//                       <Textarea
//                         id="adminNotes"
//                         value={adminNotes}
//                         onChange={(e) => setAdminNotes(e.target.value)}
//                         placeholder="Add notes about this response..."
//                         rows={4}
//                       />
//                     </div>

//                     <Button
//                       onClick={handleUpdateResponse}
//                       disabled={isUpdating}
//                       className="w-full"
//                     >
//                       {isUpdating ? "Updating..." : "Update Grade & Notes"}
//                     </Button>
//                   </CardContent>
//                 </Card>
//               </div>
//             </TabsContent>
//           )}

//           {/* Actions Tab */}
//           <TabsContent value="actions" className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {/* Export Actions */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2">
//                     <Download className="w-4 h-4" />
//                     Export & Share
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-3">
//                   <Button
//                     variant="outline"
//                     className="w-full justify-start"
//                     onClick={copyResponseData}
//                   >
//                     <Copy className="w-4 h-4 mr-2" />
//                     Copy Response Data
//                   </Button>

//                   <Button
//                     variant="outline"
//                     className="w-full justify-start"
//                     onClick={() => {
//                       const dataStr = JSON.stringify(
//                         {
//                           formTitle,
//                           response: {
//                             id: response._id,
//                             submittedAt: response.createdAt,
//                             responses: response.responses?.map((r) => {
//                               const field = formFields.find(
//                                 (f) => f.id === r.fieldId
//                               );
//                               return {
//                                 question: field?.label,
//                                 answer: r.value,
//                               };
//                             }),
//                           },
//                         },
//                         null,
//                         2
//                       );

//                       const dataUri =
//                         "data:application/json;charset=utf-8," +
//                         encodeURIComponent(dataStr);
//                       const exportFileDefaultName = `response-${response._id}.json`;

//                       const linkElement = document.createElement("a");
//                       linkElement.setAttribute("href", dataUri);
//                       linkElement.setAttribute(
//                         "download",
//                         exportFileDefaultName
//                       );
//                       linkElement.click();
//                     }}
//                   >
//                     <Download className="w-4 h-4 mr-2" />
//                     Download as JSON
//                   </Button>

//                   <Button
//                     variant="outline"
//                     className="w-full justify-start"
//                     onClick={() => {
//                       const printWindow = window.open("", "_blank");
//                       if (printWindow) {
//                         printWindow.document.write(`
//                           <html>
//                             <head>
//                               <title>Response Details - ${formTitle}</title>
//                               <style>
//                                 body { font-family: Arial, sans-serif; margin: 20px; }
//                                 .header { border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
//                                 .question { margin-bottom: 15px; }
//                                 .question-label { font-weight: bold; margin-bottom: 5px; }
//                                 .answer { margin-left: 20px; padding: 5px; background: #f5f5f5; }
//                               </style>
//                             </head>
//                             <body>
//                               <div class="header">
//                                 <h1>${formTitle}</h1>
//                                 <p>Response ID: ${response._id}</p>
//                                 <p>Submitted: ${new Date(
//                                   response.createdAt
//                                 ).toLocaleString()}</p>
//                               </div>
//                               ${formFields
//                                 .map((field) => {
//                                   const responseField =
//                                     response.responses?.find(
//                                       (r) => r.fieldId === field.id
//                                     );
//                                   return `
//                                   <div class="question">
//                                     <div class="question-label">${
//                                       field.label
//                                     }</div>
//                                     <div class="answer">${
//                                       responseField
//                                         ? responseField.value
//                                         : "No response"
//                                     }</div>
//                                   </div>
//                                 `;
//                                 })
//                                 .join("")}
//                             </body>
//                           </html>
//                         `);
//                         printWindow.document.close();
//                         printWindow.print();
//                       }
//                     }}
//                   >
//                     <FileText className="w-4 h-4 mr-2" />
//                     Print Response
//                   </Button>
//                   <Button
//                     variant="outline"
//                     className="w-full justify-start button-outline"
//                     onClick={() => setShowPrintPreview(!showPrintPreview)}
//                   >
//                     <Eye className="w-4 h-4 mr-2" />
//                     {showPrintPreview ? "Hide" : "Show"} Print Preview
//                   </Button>
//                 </CardContent>
//               </Card>

//               {/* Management Actions */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2">
//                     <Flag className="w-4 h-4" />
//                     Management
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-3">
//                   <Button
//                     variant="outline"
//                     className="w-full justify-start"
//                     onClick={() => {
//                       const subject = `Response Follow-up: ${formTitle}`;
//                       const body = `Hello,\n\nThank you for your response to "${formTitle}". We wanted to follow up with you regarding your submission.\n\nResponse ID: ${
//                         response._id
//                       }\nSubmitted: ${new Date(
//                         response.createdAt
//                       ).toLocaleString()}\n\nBest regards`;
//                       const mailtoLink = `mailto:${
//                         response.submitterEmail
//                       }?subject=${encodeURIComponent(
//                         subject
//                       )}&body=${encodeURIComponent(body)}`;
//                       window.open(mailtoLink);
//                     }}
//                     disabled={!response.submitterEmail}
//                   >
//                     <MessageSquare className="w-4 h-4 mr-2" />
//                     Email Respondent
//                   </Button>

//                   <Button
//                     variant="outline"
//                     className="w-full justify-start"
//                     onClick={() => {
//                       const url = `${window.location.origin}/forms/${response.formId}/responses/${response._id}`;
//                       navigator.clipboard.writeText(url);
//                       toast.success("Response URL copied to clipboard");
//                     }}
//                   >
//                     <ExternalLink className="w-4 h-4 mr-2" />
//                     Copy Response URL
//                   </Button>

//                   <Button
//                     variant="outline"
//                     className="w-full justify-start"
//                     onClick={() => {
//                       // Flag for review functionality
//                       toast.info("Response flagged for review");
//                     }}
//                   >
//                     <Flag className="w-4 h-4 mr-2" />
//                     Flag for Review
//                   </Button>

//                   <Separator />

//                   <Button
//                     variant="destructive"
//                     className="w-full justify-start"
//                     onClick={handleDeleteResponse}
//                     disabled={!onDelete}
//                   >
//                     <Trash2 className="w-4 h-4 mr-2" />
//                     Delete Response
//                   </Button>
//                 </CardContent>
//               </Card>

//               {/* Response Statistics */}
//               <Card className="md:col-span-2">
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2">
//                     <BarChart3 className="w-4 h-4" />
//                     Response Statistics
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                     <div className="text-center p-3 bg-blue-50 rounded-lg">
//                       <div className="text-2xl font-bold text-blue-600">
//                         {response.responses?.length}
//                       </div>
//                       <div className="text-sm text-blue-800">
//                         Fields Answered
//                       </div>
//                     </div>

//                     <div className="text-center p-3 bg-green-50 rounded-lg">
//                       <div className="text-2xl font-bold text-green-600">
//                         {Math.round(
//                           (response.responses?.length / formFields.length) * 100
//                         )}
//                         %
//                       </div>
//                       <div className="text-sm text-green-800">
//                         Completion Rate
//                       </div>
//                     </div>

//                     <div className="text-center p-3 bg-purple-50 rounded-lg">
//                       <div className="text-2xl font-bold text-purple-600">
//                         {formatDuration(response.timeSpent)}
//                       </div>
//                       <div className="text-sm text-purple-800">Time Spent</div>
//                     </div>

//                     <div className="text-center p-3 bg-orange-50 rounded-lg">
//                       <div className="text-2xl font-bold text-orange-600">
//                         {response.status === "completed" ? "✓" : "○"}
//                       </div>
//                       <div className="text-sm text-orange-800">Status</div>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Admin Notes Display */}
//               {response.adminNotes && (
//                 <Card className="md:col-span-2">
//                   <CardHeader>
//                     <CardTitle className="flex items-center gap-2">
//                       <MessageSquare className="w-4 h-4" />
//                       Admin Notes
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="p-3 bg-gray-50 rounded-lg">
//                       <p className="text-sm whitespace-pre-wrap">
//                         {response.adminNotes}
//                       </p>
//                     </div>
//                   </CardContent>
//                 </Card>
//               )}
//             </div>
//           </TabsContent>
//         </Tabs>
//       </DialogContent>
//     </Dialog>
//   );
// }
