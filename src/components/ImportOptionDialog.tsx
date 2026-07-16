"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Upload, FileText, Database, X } from "lucide-react";
import { parseCSV, parseJSON } from "@/lib/datas";

interface ImportOptionsDialogProps {
  onImport: (options: string[]) => void;
  trigger?: React.ReactNode;
}

export default function ImportOptionsDialog({
  onImport,
  trigger,
}: ImportOptionsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [importType, setImportType] = useState<"csv" | "json">("csv");
  const [textInput, setTextInput] = useState("");
  const [previewOptions, setPreviewOptions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setTextInput(content);
      handlePreview(content);
    };
    reader.readAsText(file);
  };

  const handlePreview = (content: string = textInput) => {
    if (!content.trim()) {
      setPreviewOptions([]);
      return;
    }

    setIsProcessing(true);
    try {
      let options: string[] = [];

      if (importType === "csv") {
        options = parseCSV(content);
      } else {
        options = parseJSON(content);
      }

      setPreviewOptions(options.slice(0, 50)); // Show first 50 for preview

      if (options.length > 50) {
        toast.info(`Showing first 50 of ${options.length} options`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to parse data"
      );
      setPreviewOptions([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (previewOptions.length === 0) {
      toast.error("No valid options to import");
      return;
    }

    try {
      let allOptions: string[] = [];

      if (importType === "csv") {
        allOptions = parseCSV(textInput);
      } else {
        allOptions = parseJSON(textInput);
      }

      onImport(allOptions);
      toast.success(`Imported ${allOptions.length} options successfully`);
      setIsOpen(false);
      setTextInput("");
      setPreviewOptions([]);
    } catch (error) {
      toast.error("Failed to import options");
    }
  };

  const handleReset = () => {
    setTextInput("");
    setPreviewOptions([]);
  };

  const csvExample = `Option 1
Option 2
Option 3
"Option with, comma"
Option 5`;

  const jsonExample = `[
  "Option 1",
  "Option 2",
  "Option 3"
]

// Or object format:
[
  {"name": "Option 1", "value": "opt1"},
  {"name": "Option 2", "value": "opt2"}
]`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import Options
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Import Options from File or Text
          </DialogTitle>
          <DialogDescription>
            Import options from CSV or JSON format. You can upload a file or
            paste the content directly.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={importType}
          onValueChange={(value) => setImportType(value as "csv" | "json")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              CSV Format
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              JSON Format
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label>Upload CSV File</Label>
                <Input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
              </div>

              <div className="text-center text-sm text-muted-foreground">or</div>

              <div>
                <Label>Paste CSV Content</Label>
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste your CSV content here..."
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-sm font-medium">
                  CSV Format Example:
                </Label>
                <pre className="text-xs mt-1 text-muted-foreground">{csvExample}</pre>
                <p className="text-xs text-muted-foreground mt-2">
                  • One option per line • Comma-separated values supported • Use
                  quotes for values containing commas
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label>Upload JSON File</Label>
                <Input
                  type="file"
                  accept=".json,.txt"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
              </div>

              <div className="text-center text-sm text-muted-foreground">or</div>

              <div>
                <Label>Paste JSON Content</Label>
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste your JSON content here..."
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-sm font-medium">
                  JSON Format Example:
                </Label>
                <pre className="text-xs mt-1 text-muted-foreground">{jsonExample}</pre>
                <p className="text-xs text-muted-foreground mt-2">
                  • Array of strings • Array of objects with name/label/value
                  properties • Must be valid JSON format
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button
            onClick={() => handlePreview()}
            variant="outline"
            disabled={!textInput.trim() || isProcessing}
          >
            {isProcessing ? "Processing..." : "Preview"}
          </Button>
          <Button onClick={handleReset} variant="ghost" size="sm">
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>

        {previewOptions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Preview ({previewOptions.length} options)</Label>
              <Badge variant="secondary">
                {importType.toUpperCase()} Format
              </Badge>
            </div>
            <div className="max-h-32 overflow-y-auto border border-border rounded-lg p-3 bg-muted">
              <div className="flex flex-wrap gap-1">
                {previewOptions.map((option, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {option}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={previewOptions.length === 0}>
            Import {previewOptions.length} Options
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
