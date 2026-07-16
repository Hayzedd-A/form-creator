"use client";


import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Settings,
  Eye,
  Mail,
  Calendar,
  Palette,
  Bell,
  Upload,
  Type,
  AlignLeft,
  Hash,
  Phone,
  Link2,
  Clock,
  CalendarClock,
  CircleDot,
  CheckSquare,
  ChevronDownSquare,
  ToggleLeft,
  Star,
  SlidersHorizontal,
  PenTool,
  MapPin,
  Paperclip,
} from "lucide-react";
import Link from "next/link";
import { PREDEFINED_OPTIONS, PREDEFINED_CATEGORIES } from "@/lib/datas";
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
  correctAnswer?: any; // For assignment mode
  explanation?: string; // For assignment mode
}

interface FormSettings {
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
}

const FIELD_TYPES = [
  { value: "short-text", label: "Short Text", icon: Type },
  { value: "paragraph", label: "Paragraph", icon: AlignLeft },
  { value: "email", label: "Email", icon: Mail },
  { value: "number", label: "Number", icon: Hash },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "url", label: "URL", icon: Link2 },
  { value: "date", label: "Date", icon: Calendar },
  { value: "time", label: "Time", icon: Clock },
  { value: "datetime", label: "Date & Time", icon: CalendarClock },
  { value: "multiple-choice", label: "Multiple Choice", icon: CircleDot },
  { value: "checkbox", label: "Checkboxes", icon: CheckSquare },
  { value: "dropdown", label: "Dropdown", icon: ChevronDownSquare },
  { value: "yes-no", label: "Yes/No", icon: ToggleLeft },
  { value: "rating", label: "Rating", icon: Star },
  { value: "linear-scale", label: "Linear Scale", icon: SlidersHorizontal },
  { value: "file-upload", label: "File Upload", icon: Paperclip },
  { value: "signature", label: "Signature", icon: PenTool },
  { value: "address", label: "Address", icon: MapPin },
];

function CreateFormSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
            <div className="h-7 w-44 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <div className="h-10 w-full max-w-md animate-pulse rounded-md bg-muted" />
        <Card>
          <CardHeader>
            <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-56 animate-pulse rounded-md bg-muted" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
            <div className="h-20 w-full animate-pulse rounded-md bg-muted" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-56 animate-pulse rounded-md bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-32 w-full animate-pulse rounded-md bg-muted" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CreateForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [settings, setSettings] = useState<FormSettings>({
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
    showProgressBar: true,
    allowSaveDraft: false,
    customTheme: {},
    notifications: {
      emailOnSubmission: false,
      notificationEmails: [],
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [notificationEmailInput, setNotificationEmailInput] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  const addField = (type: FormField["type"]) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
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
        allowMultiple: true,
      }),
      ...(type === "dropdown" && {
        options: ["Option 1", "Option 2"],
      }),
      ...(type === "rating" && { maxRating: 5 }),
      ...(type === "linear-scale" && {
        minScale: 1,
        maxScale: 10,
        scaleLabels: { min: "Poor", max: "Excellent" },
      }),
      ...(type === "number" && { step: 1 }),
      ...(type === "date" && { dateFormat: "MM/DD/YYYY" }),
      ...(type === "file-upload" && {
        maxFileSize: 10,
        maxFiles: 1,
        allowedFileTypes: ["image/*", "application/pdf"],
      }),
    };
    setFields([...fields, newField]);
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
  };

  const addAllowedEmail = () => {
    if (
      emailInput.trim() &&
      !settings.allowedEmails.includes(emailInput.trim())
    ) {
      setSettings({
        ...settings,
        allowedEmails: [...settings.allowedEmails, emailInput.trim()],
      });
      setEmailInput("");
    }
  };

  const removeAllowedEmail = (email: string) => {
    setSettings({
      ...settings,
      allowedEmails: settings.allowedEmails.filter((e) => e !== email),
    });
  };

  const addNotificationEmail = () => {
    if (
      notificationEmailInput.trim() &&
      !settings.notifications.notificationEmails.includes(
        notificationEmailInput.trim()
      )
    ) {
      setSettings({
        ...settings,
        notifications: {
          ...settings.notifications,
          notificationEmails: [
            ...settings.notifications.notificationEmails,
            notificationEmailInput.trim(),
          ],
        },
      });
      setNotificationEmailInput("");
    }
  };

  const removeNotificationEmail = (email: string) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        notificationEmails: settings.notifications.notificationEmails.filter(
          (e) => e !== email
        ),
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Form title is required");
      return;
    }

    if (fields.length === 0) {
      toast.error("Please add at least one field to your form");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          fields: fields.map((field, index) => ({ ...field, order: index })),
          settings,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Form created successfully");
        router.push(`/forms/${data.form.slug}/edit`);
      } else {
        toast.error(data.error || "Failed to create form");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

 const renderFieldEditor = (field: FormField) => {
   const addOption = () => {
     const newOptions = [
       ...(field.options || []),
       `Option ${(field.options?.length || 0) + 1}`,
     ];
     updateField(field.id, { options: newOptions });
   };

   const updateOption = (index: number, value: string) => {
     const newOptions = [...(field.options || [])];
     newOptions[index] = value;
     updateField(field.id, { options: newOptions });
   };

   const removeOption = (index: number) => {
     const newOptions = field.options?.filter((_, i) => i !== index);
     updateField(field.id, { options: newOptions });
   };

   const loadPredefinedOptions = (optionKey: string) => {
     if (
       optionKey &&
       PREDEFINED_OPTIONS[optionKey as keyof typeof PREDEFINED_OPTIONS]
     ) {
       const predefinedOptions =
         PREDEFINED_OPTIONS[optionKey as keyof typeof PREDEFINED_OPTIONS];
       updateField(field.id, { options: predefinedOptions });
     }
   };

   const clearAllOptions = () => {
     updateField(field.id, { options: [] });
   };

   const FieldIcon =
     FIELD_TYPES.find((t) => t.value === field.type)?.icon ?? Type;

   return (
     <div key={field.id} className="border border-border rounded-lg p-4 bg-muted/30">
       <div className="flex items-center justify-between mb-3">
         <div className="flex items-center gap-2">
           <GripVertical className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
           <FieldIcon className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
           <span className="font-medium text-foreground">
             {field.type
               .replace("-", " ")
               .replace(/\b\w/g, (l) => l.toUpperCase())}
           </span>
         </div>
         <Button
           type="button"
           variant="ghost"
           size="sm"
           onClick={() => removeField(field.id)}
           aria-label="Remove field"
         >
           <Trash2 className="w-4 h-4" />
         </Button>
       </div>

       <div className="space-y-3">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
           <div>
             <Label>Field Label *</Label>
             <Input
               value={field.label}
               onChange={(e) =>
                 updateField(field.id, { label: e.target.value })
               }
               placeholder="Enter field label"
             />
           </div>
           <div>
             <Label>Width</Label>
             <Select
               value={field.width}
               onValueChange={(value: "full" | "half") =>
                 updateField(field.id, { width: value })
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
           <Label>Description (Help Text)</Label>
           <Input
             value={field.description || ""}
             onChange={(e) =>
               updateField(field.id, { description: e.target.value })
             }
             placeholder="Optional help text for this field"
           />
         </div>

         {/* Text field settings */}
         {(field.type === "short-text" ||
           field.type === "paragraph" ||
           field.type === "email" ||
           field.type === "url" ||
           field.type === "phone") && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             <div>
               <Label>Placeholder</Label>
               <Input
                 value={field.placeholder || ""}
                 onChange={(e) =>
                   updateField(field.id, { placeholder: e.target.value })
                 }
                 placeholder="Placeholder text"
               />
             </div>
             <div>
               <Label>Max Length</Label>
               <Input
                 type="number"
                 value={field.maxLength || ""}
                 onChange={(e) =>
                   updateField(field.id, {
                     maxLength: parseInt(e.target.value) || undefined,
                   })
                 }
                 placeholder="Maximum characters"
               />
             </div>
           </div>
         )}

         {/* Number field settings */}
         {field.type === "number" && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             <div>
               <Label>Min Value</Label>
               <Input
                 type="number"
                 value={field.minValue || ""}
                 onChange={(e) =>
                   updateField(field.id, {
                     minValue: parseInt(e.target.value) || undefined,
                   })
                 }
                 placeholder="Minimum value"
               />
             </div>
             <div>
               <Label>Max Value</Label>
               <Input
                 type="number"
                 value={field.maxValue || ""}
                 onChange={(e) =>
                   updateField(field.id, {
                     maxValue: parseInt(e.target.value) || undefined,
                   })
                 }
                 placeholder="Maximum value"
               />
             </div>
             <div>
               <Label>Step</Label>
               <Input
                 type="number"
                 value={field.step || 1}
                 onChange={(e) =>
                   updateField(field.id, {
                     step: parseInt(e.target.value) || 1,
                   })
                 }
                 placeholder="Step increment"
               />
             </div>
           </div>
         )}

         {/* Date field settings */}
         {(field.type === "date" || field.type === "datetime") && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             <div>
               <Label>Date Format</Label>
               <Select
                 value={field.dateFormat}
                 onValueChange={(value: any) =>
                   updateField(field.id, { dateFormat: value })
                 }
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
             <div>
               <Label>Min Date</Label>
               <Input
                 type="date"
                 value={field.minDate || ""}
                 onChange={(e) =>
                   updateField(field.id, { minDate: e.target.value })
                 }
               />
             </div>
             <div>
               <Label>Max Date</Label>
               <Input
                 type="date"
                 value={field.maxDate || ""}
                 onChange={(e) =>
                   updateField(field.id, { maxDate: e.target.value })
                 }
               />
             </div>
           </div>
         )}

         {/* Choice-based field options - UPDATED SECTION */}
         {(field.type === "multiple-choice" ||
           field.type === "checkbox" ||
           field.type === "dropdown") && (
           <div>
             <div className="flex items-center justify-between mb-2">
               <Label>Options</Label>
               <div className="flex gap-2">
                 <Select onValueChange={loadPredefinedOptions}>
                   <SelectTrigger className="w-48">
                     <SelectValue placeholder="Load predefined options" />
                   </SelectTrigger>
                   <SelectContent>
                     {PREDEFINED_CATEGORIES.map((category) => (
                       <div key={category.label}>
                         <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
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
                     updateField(field.id, { options: importedOptions })
                   }
                   trigger={
                     <Button type="button" variant="outline" size="sm">
                       <Upload className="w-4 h-4 mr-2" />
                       Import
                     </Button>
                   }
                 />
               </div>
             </div>

             <div className="space-y-2">
               {field.options?.map((option, optionIndex) => (
                 <div key={optionIndex} className="flex gap-2">
                   <Input
                     value={option}
                     onChange={(e) => updateOption(optionIndex, e.target.value)}
                     placeholder={`Option ${optionIndex + 1}`}
                   />
                   <Button
                     type="button"
                     variant="ghost"
                     size="sm"
                     onClick={() => removeOption(optionIndex)}
                     disabled={(field.options?.length || 0) <= 1}
                   >
                     <Trash2 className="w-4 h-4" />
                   </Button>
                 </div>
               ))}
             </div>

             <div className="flex gap-2 mt-2">
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
                 onClick={clearAllOptions}
               >
                 Clear All
               </Button>
             </div>

             {field.type === "multiple-choice" && (
               <div className="flex items-center gap-2 mt-3">
                 <Switch
                   checked={field.allowOther || false}
                   onCheckedChange={(checked) =>
                     updateField(field.id, { allowOther: checked })
                   }
                 />
                 <Label>Allow "Other" option</Label>
               </div>
             )}
           </div>
         )}

         {/* Rating field settings */}
         {field.type === "rating" && (
           <div>
             <Label>Maximum Rating</Label>
             <Select
               value={field.maxRating?.toString()}
               onValueChange={(value) =>
                 updateField(field.id, { maxRating: parseInt(value) })
               }
             >
               <SelectTrigger className="w-32">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="3">3 Stars</SelectItem>
                 <SelectItem value="5">5 Stars</SelectItem>
                 <SelectItem value="10">10 Stars</SelectItem>
               </SelectContent>
             </Select>
           </div>
         )}

         {/* Linear scale settings */}
         {field.type === "linear-scale" && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             <div className="grid grid-cols-2 gap-2">
               <div>
                 <Label>Min Scale</Label>
                 <Input
                   type="number"
                   value={field.minScale || 1}
                   onChange={(e) =>
                     updateField(field.id, {
                       minScale: parseInt(e.target.value) || 1,
                     })
                   }
                 />
               </div>
               <div>
                 <Label>Max Scale</Label>
                 <Input
                   type="number"
                   value={field.maxScale || 10}
                   onChange={(e) =>
                     updateField(field.id, {
                       maxScale: parseInt(e.target.value) || 10,
                     })
                   }
                 />
               </div>
             </div>
             <div className="grid grid-cols-2 gap-2">
               <div>
                 <Label>Min Label</Label>
                 <Input
                   value={field.scaleLabels?.min || ""}
                   onChange={(e) =>
                     updateField(field.id, {
                       scaleLabels: {
                         ...field.scaleLabels,
                         min: e.target.value,
                       },
                     })
                   }
                   placeholder="e.g., Poor"
                 />
               </div>
               <div>
                 <Label>Max Label</Label>
                 <Input
                   value={field.scaleLabels?.max || ""}
                   onChange={(e) =>
                     updateField(field.id, {
                       scaleLabels: {
                         ...field.scaleLabels,
                         max: e.target.value,
                       },
                     })
                   }
                   placeholder="e.g., Excellent"
                 />
               </div>
             </div>
           </div>
         )}

         {/* File upload settings */}
         {field.type === "file-upload" && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             <div>
               <Label>Max File Size (MB)</Label>
               <Input
                 type="number"
                 value={field.maxFileSize || 10}
                 onChange={(e) =>
                   updateField(field.id, {
                     maxFileSize: parseInt(e.target.value) || 10,
                   })
                 }
               />
             </div>
             <div>
               <Label>Max Files</Label>
               <Input
                 type="number"
                 value={field.maxFiles || 1}
                 onChange={(e) =>
                   updateField(field.id, {
                     maxFiles: parseInt(e.target.value) || 1,
                   })
                 }
               />
             </div>
           </div>
         )}

         {/* Assignment mode - correct answer */}
         {settings.assignmentMode && (
           <div className="border-t pt-3 mt-3">
             <Label>Correct Answer (Assignment Mode)</Label>
             {field.type === "multiple-choice" || field.type === "dropdown" ? (
               <Select
                 value={field.correctAnswer}
                 onValueChange={(value) =>
                   updateField(field.id, { correctAnswer: value })
                 }
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Select correct answer" />
                 </SelectTrigger>
                 <SelectContent>
                   {field.options?.map((option, index) => (
                     <SelectItem key={index} value={option}>
                       {option}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             ) : field.type === "checkbox" ? (
               <div className="space-y-2">
                 <Label className="text-sm">Select correct answers:</Label>
                 {field.options?.map((option, index) => (
                   <label
                     key={index}
                     className="flex items-center gap-2 cursor-pointer"
                   >
                     <input
                       type="checkbox"
                       className="accent-primary h-4 w-4"
                       checked={(field.correctAnswer || []).includes(option)}
                       onChange={(e) => {
                         const current = field.correctAnswer || [];
                         if (e.target.checked) {
                           updateField(field.id, {
                             correctAnswer: [...current, option],
                           });
                         } else {
                           updateField(field.id, {
                             correctAnswer: current.filter(
                               (item: string) => item !== option
                             ),
                           });
                         }
                       }}
                     />
                     <span className="text-sm text-foreground">{option}</span>
                   </label>
                 ))}
               </div>
             ) : field.type === "yes-no" ? (
               <Select
                 value={field.correctAnswer}
                 onValueChange={(value) =>
                   updateField(field.id, { correctAnswer: value })
                 }
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Select correct answer" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="yes">Yes</SelectItem>
                   <SelectItem value="no">No</SelectItem>
                 </SelectContent>
               </Select>
             ) : field.type === "rating" ? (
               <Input
                 type="number"
                 min="1"
                 max={field.maxRating || 5}
                 value={field.correctAnswer || ""}
                 onChange={(e) =>
                   updateField(field.id, {
                     correctAnswer: parseInt(e.target.value) || undefined,
                   })
                 }
                 placeholder="Enter correct rating"
               />
             ) : field.type === "linear-scale" ? (
               <Input
                 type="number"
                 min={field.minScale || 1}
                 max={field.maxScale || 10}
                 value={field.correctAnswer || ""}
                 onChange={(e) =>
                   updateField(field.id, {
                     correctAnswer: parseInt(e.target.value) || undefined,
                   })
                 }
                 placeholder="Enter correct scale value"
               />
             ) : (
               <Input
                 value={field.correctAnswer || ""}
                 onChange={(e) =>
                   updateField(field.id, { correctAnswer: e.target.value })
                 }
                 placeholder="Enter correct answer"
               />
             )}
             <div className="mt-2">
               <Label>Explanation</Label>
               <Textarea
                 value={field.explanation || ""}
                 onChange={(e) =>
                   updateField(field.id, { explanation: e.target.value })
                 }
                 placeholder="Explain why this is the correct answer"
                 className="h-20"
               />
             </div>
           </div>
         )}

         <div className="flex items-center gap-4 pt-2 border-t">
           <div className="flex items-center gap-2">
             <Switch
               checked={field.required}
               onCheckedChange={(checked) =>
                 updateField(field.id, { required: checked })
               }
             />
             <Label>Required field</Label>
           </div>
         </div>
       </div>
     </div>
   );
 };

  if (status === "loading") {
    return <CreateFormSkeleton />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Create New Form
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="form" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="form">Form Builder</TabsTrigger>
              <TabsTrigger value="access">Access & Security</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Form Details</CardTitle>
                  <CardDescription>
                    Set up the basic information for your form
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter form description (optional)"
                      className="h-20"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={settings.assignmentMode}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, assignmentMode: checked })
                        }
                      />
                      <Label>Assignment Mode</Label>
                    </div>
                    {settings.assignmentMode && (
                      <Badge variant="secondary">
                        Users will see results and corrections after submission
                      </Badge>
                    )}
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
                    {fields.map((field) => renderFieldEditor(field))}

                    <div className="border-2 border-dashed border-border rounded-lg p-6">
                      <div className="text-center">
                        <p className="text-muted-foreground mb-4">
                          {fields.length === 0
                            ? "No fields yet. Add one to start building your form."
                            : "Add a field to your form"}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {FIELD_TYPES.map((fieldType) => (
                            <Button
                              key={fieldType.value}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                addField(fieldType.value as FormField["type"])
                              }
                              className="flex flex-col h-16 text-xs"
                            >
                              <fieldType.icon
                                className="w-4 h-4 mb-1"
                                aria-hidden="true"
                              />
                              {fieldType.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="access" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Access Control
                  </CardTitle>
                  <CardDescription>
                    Control who can access and submit your form
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Public Form</Label>
                      <p className="text-sm text-muted-foreground">
                        Anyone with the link can access this form
                      </p>
                    </div>
                    <Switch
                      checked={settings.isPublic}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, isPublic: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Login</Label>
                      <p className="text-sm text-muted-foreground">
                        Users must be logged in to submit
                      </p>
                    </div>
                    <Switch
                      checked={settings.requireLogin}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, requireLogin: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Collect Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Require email before showing form content
                      </p>
                    </div>
                    <Switch
                      checked={settings.collectEmail}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, collectEmail: checked })
                      }
                    />
                  </div>

                  <div>
                    <Label>Allowed Emails</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Only these emails can access the form (leave empty for no
                      restriction)
                    </p>
                    <div className="flex gap-2 mb-2">
                      <Input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="Enter email address"
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), addAllowedEmail())
                        }
                      />
                      <Button type="button" onClick={addAllowedEmail} size="sm">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {settings.allowedEmails.map((email) => (
                        <Badge
                          key={email}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {email}
                          <button
                            type="button"
                            onClick={() => removeAllowedEmail(email)}
                            className="ml-1 hover:text-destructive"
                            aria-label={`Remove ${email}`}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Response Limits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Limit One Response per User</Label>
                      <p className="text-sm text-muted-foreground">
                        Prevent multiple submissions from the same user
                      </p>
                    </div>
                    <Switch
                      checked={settings.limitOneResponse}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, limitOneResponse: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Limit by Email</Label>
                      <p className="text-sm text-muted-foreground">
                        One response per email address
                      </p>
                    </div>
                    <Switch
                      checked={settings.limitByEmail}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, limitByEmail: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Limit by IP Address</Label>
                      <p className="text-sm text-muted-foreground">
                        One response per IP address
                      </p>
                    </div>
                    <Switch
                      checked={settings.limitByIP}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, limitByIP: checked })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Open Date</Label>
                      <Input
                        type="datetime-local"
                        value={settings.openDate || ""}
                        onChange={(e) =>
                          setSettings({ ...settings, openDate: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Close Date</Label>
                      <Input
                        type="datetime-local"
                        value={settings.closeDate || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            closeDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Form Appearance
                  </CardTitle>
                  <CardDescription>
                    Customize the look and feel of your form
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Progress Bar</Label>
                      <p className="text-sm text-muted-foreground">
                        Display progress indicator to users
                      </p>
                    </div>
                    <Switch
                      checked={settings.showProgressBar}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, showProgressBar: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Save Draft</Label>
                      <p className="text-sm text-muted-foreground">
                        Users can save and continue later
                      </p>
                    </div>
                    <Switch
                      checked={settings.allowSaveDraft}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, allowSaveDraft: checked })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Primary Color</Label>
                      <Input
                        type="color"
                        value={settings.customTheme.primaryColor || "#3b82f6"}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            customTheme: {
                              ...settings.customTheme,
                              primaryColor: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Background Color</Label>
                      <Input
                        type="color"
                        value={
                          settings.customTheme.backgroundColor || "#ffffff"
                        }
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            customTheme: {
                              ...settings.customTheme,
                              backgroundColor: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Custom Success Message</Label>
                    <Textarea
                      value={settings.customSuccessMessage || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          customSuccessMessage: e.target.value,
                        })
                      }
                      placeholder="Thank you for your submission!"
                      className="h-20"
                    />
                  </div>

                  <div>
                    <Label>Redirect URL (Optional)</Label>
                    <Input
                      type="url"
                      value={settings.redirectUrl || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          redirectUrl: e.target.value,
                        })
                      }
                      placeholder="https://example.com/thank-you"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Email Notifications
                  </CardTitle>
                  <CardDescription>
                    Configure email notifications for form submissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email on Submission</Label>
                      <p className="text-sm text-muted-foreground">
                        Send email when someone submits the form
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.emailOnSubmission}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            emailOnSubmission: checked,
                          },
                        })
                      }
                    />
                  </div>

                  {settings.notifications.emailOnSubmission && (
                    <div>
                      <Label>Notification Emails</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Email addresses to notify on form submission
                      </p>
                      <div className="flex gap-2 mb-2">
                        <Input
                          type="email"
                          value={notificationEmailInput}
                          onChange={(e) =>
                            setNotificationEmailInput(e.target.value)
                          }
                          placeholder="Enter email address"
                          onKeyPress={(e) =>
                            e.key === "Enter" &&
                            (e.preventDefault(), addNotificationEmail())
                          }
                        />
                        <Button
                          type="button"
                          onClick={addNotificationEmail}
                          size="sm"
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {settings.notifications.notificationEmails.map(
                          (email) => (
                            <Badge
                              key={email}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <Mail className="w-3 h-3" />
                              {email}
                              <button
                                type="button"
                                onClick={() => removeNotificationEmail(email)}
                                className="ml-1 hover:text-destructive"
                                aria-label={`Remove ${email}`}
                              >
                                ×
                              </button>
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              {fields.length} field{fields.length !== 1 ? "s" : ""} added
            </div>
            <div className="flex gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !title.trim() || fields.length === 0}
              >
                {isLoading ? "Creating..." : "Create Form"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
