"use client";

import React, { useState, useRef, useCallback } from "react";
import { Upload, X, Eye, Crop, Download, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatFileSize } from "@/lib/utils";
import Image from "next/image";

interface FileUploadProps {
  fieldId: string;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  allowedFileTypes?: string[];
  onFilesChange: (files: File[]) => void;
  value?: File[];
  className?: string;
  disabled?: boolean;
}

interface FilePreview {
  file: File;
  url: string;
  id: string;
}

export function FileUpload({
  fieldId,
  maxFiles = 1,
  maxFileSize = 10,
  allowedFileTypes = ["image/*"],
  onFilesChange,
  value = [],
  className = "",
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState<FilePreview | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [cropFile, setCropFile] = useState<FilePreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize files from value prop
  React.useEffect(() => {
    if (value && value.length > 0) {
      const filesPreviews = value.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9),
      }));
      setFiles(filesPreviews);
    }
  }, [value]);

  const isImageFile = (file: File): boolean => {
    return file.type.startsWith("image/");
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSizeBytes = maxFileSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    // Check file type
    if (allowedFileTypes.length > 0) {
      const isAllowed = allowedFileTypes.some((type) => {
        if (type.endsWith("/*")) {
          return file.type.startsWith(type.replace("/*", "/"));
        }
        return file.type === type || file.name.toLowerCase().endsWith(type.replace(".", ""));
      });

      if (!isAllowed) {
        return `File type not allowed. Allowed types: ${allowedFileTypes.join(", ")}`;
      }
    }

    return null;
  };

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles: FilePreview[] = [];
    const errors: string[] = [];

    fileArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push({
          file,
          url: URL.createObjectURL(file),
          id: Math.random().toString(36).substr(2, 9),
        });
      }
    });

    if (errors.length > 0) {
      toast.error(errors.join("\n"));
    }

    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles.map((f) => f.file));
    }
  }, [files, maxFiles, maxFileSize, allowedFileTypes, onFilesChange]);

  const removeFile = (id: string) => {
    const updatedFiles = files.filter((f) => f.id !== id);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles.map((f) => f.file));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  const openCropDialog = (file: FilePreview) => {
    if (isImageFile(file.file)) {
      setCropFile(file);
      setShowCropDialog(true);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${dragActive ? "border-primary bg-primary/5" : "border-gray-300"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary cursor-pointer"}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={allowedFileTypes.join(",")}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        <p className="text-sm text-gray-600 mb-1">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-gray-500">
          {allowedFileTypes.includes("image/*") ? "Images" : allowedFileTypes.join(", ")} up to {maxFileSize}MB
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Uploaded Files ({files.length}/{maxFiles})
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {files.map((filePreview) => (
              <FilePreviewItem
                key={filePreview.id}
                filePreview={filePreview}
                onRemove={() => removeFile(filePreview.id)}
                onPreview={() => setPreviewFile(filePreview)}
                onCrop={() => openCropDialog(filePreview)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {/* File Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="space-y-4">
              {isImageFile(previewFile.file) ? (
                <div className="relative max-h-[60vh] overflow-hidden rounded-lg">
                  <Image
                    src={previewFile.url}
                    alt={previewFile.file.name}
                    width={800}
                    height={600}
                    className="w-full h-auto object-contain"
                  />
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-600">Preview not available for this file type</p>
                </div>
              )}
              <div className="text-sm text-gray-600">
                <p><strong>Name:</strong> {previewFile.file.name}</p>
                <p><strong>Size:</strong> {formatFileSize(previewFile.file.size)}</p>
                <p><strong>Type:</strong> {previewFile.file.type}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Crop Dialog */}
      {showCropDialog && cropFile && (
        <ImageCropDialog
          file={cropFile}
          onSave={(croppedFile) => {
            // Replace the original file with cropped version
            const updatedFiles = files.map((f) =>
              f.id === cropFile.id
                ? { ...f, file: croppedFile, url: URL.createObjectURL(croppedFile) }
                : f
            );
            setFiles(updatedFiles);
            onFilesChange(updatedFiles.map((f) => f.file));
            setShowCropDialog(false);
            setCropFile(null);
          }}
          onCancel={() => {
            setShowCropDialog(false);
            setCropFile(null);
          }}
        />
      )}
    </div>
  );
}

interface FilePreviewItemProps {
  filePreview: FilePreview;
  onRemove: () => void;
  onPreview: () => void;
  onCrop: () => void;
  disabled: boolean;
}

function FilePreviewItem({ filePreview, onRemove, onPreview, onCrop, disabled }: FilePreviewItemProps) {
  const isImage = filePreview.file.type.startsWith("image/");

  return (
    <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
      {/* File Icon/Thumbnail */}
      <div className="flex-shrink-0">
        {isImage ? (
          <div className="w-12 h-12 relative rounded overflow-hidden">
            <Image
              src={filePreview.url}
              alt={filePreview.file.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              {filePreview.file.name.split('.').pop()?.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {filePreview.file.name}
        </p>
        <p className="text-xs text-gray-500">
          {formatFileSize(filePreview.file.size)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onPreview}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <Eye className="w-4 h-4" />
        </Button>
        {isImage && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCrop}
            disabled={disabled}
            className="h-8 w-8 p-0"
          >
            <Crop className="w-4 h-4" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={disabled}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

interface ImageCropDialogProps {
  file: FilePreview;
  onSave: (croppedFile: File) => void;
  onCancel: () => void;
}

function ImageCropDialog({ file, onSave, onCancel }: ImageCropDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    const img = imageRef.current;
    if (img) {
      // Initialize crop to center 80% of image
      const width = img.clientWidth * 0.8;
      const height = img.clientHeight * 0.8;
      const x = (img.clientWidth - width) / 2;
      const y = (img.clientHeight - height) / 2;
      setCrop({ x, y, width, height });
      setImageLoaded(true);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - crop.x, y: e.clientY - crop.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return;

    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - dragStart.x, rect.width - crop.width));
    const y = Math.max(0, Math.min(e.clientY - dragStart.y, rect.height - crop.height));
    
    setCrop(prev => ({ ...prev, x, y }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCropSave = async () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate scale factors
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    // Set canvas size to crop dimensions
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    // Draw cropped image
    ctx.drawImage(
      img,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], file.file.name, {
          type: file.file.type,
          lastModified: Date.now(),
        });
        onSave(croppedFile);
      }
    }, file.file.type);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div 
            className="relative inline-block max-w-full max-h-[60vh] overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <Image
              ref={imageRef}
              src={file.url}
              alt={file.file.name}
              width={800}
              height={600}
              className="max-w-full max-h-[60vh] object-contain"
              onLoad={handleImageLoad}
            />
            
            {imageLoaded && (
              <>
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none" />
                
                {/* Crop area */}
                <div
                  className="absolute border-2 border-white bg-transparent cursor-move"
                  style={{
                    left: crop.x,
                    top: crop.y,
                    width: crop.width,
                    height: crop.height,
                  }}
                  onMouseDown={handleMouseDown}
                >
                  {/* Corner handles */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-gray-400 cursor-nw-resize" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-gray-400 cursor-ne-resize" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-gray-400 cursor-sw-resize" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-gray-400 cursor-se-resize" />
                </div>
              </>
            )}
          </div>

          {/* Crop controls */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Drag to move crop area. Use corner handles to resize.
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (imageRef.current) {
                    const img = imageRef.current;
                    setCrop({
                      x: 0,
                      y: 0,
                      width: img.clientWidth,
                      height: img.clientHeight,
                    });
                  }
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleCropSave}>
            Save Cropped Image
          </Button>
        </DialogFooter>

        {/* Hidden canvas for cropping */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}