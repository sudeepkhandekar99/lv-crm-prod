"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file before uploading.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload-product-image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const result = await response.json();
      setUploadedUrl(result.url);

      toast({
        title: "File Uploaded",
        description: "Your file has been uploaded successfully.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Upload Failed",
        description: "An error occurred while uploading the file.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="file-upload">Select a file to upload:</Label>
      <Input
        id="file-upload"
        type="file"
        onChange={handleFileChange}
        className="mb-2"
        disabled={isUploading}
      />
      <Button onClick={handleUpload} disabled={isUploading || !file}>
        {isUploading ? "Uploading..." : "Upload"}
      </Button>
      {uploadedUrl && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">File uploaded successfully:</p>
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {uploadedUrl}
          </a>
        </div>
      )}
    </div>
  );
}
