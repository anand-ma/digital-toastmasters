import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, X, FileVideo, FileAudio, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { processRecording } from "@/services/api";

export default function Upload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [sizeWarning, setSizeWarning] = useState<boolean>(false);
  
  const allowedFileTypes = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "audio/mpeg",
    "audio/mp4",
    "audio/wav",
    "audio/ogg"
  ];
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };
  
  const validateAndSetFile = (file: File) => {
    if (!allowedFileTypes.includes(file.type)) {
      toast({
        title: "Invalid file format",
        description: "Please upload a video or audio file in MP4, WebM, MOV, MP3, WAV, or OGG format.",
        variant: "destructive",
      });
      return;
    }
    
    // Show warning for large files
    if (file.size > 20 * 1024 * 1024) {
      setSizeWarning(true);
    } else {
      setSizeWarning(false);
    }
    
    // 100MB max file size
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be less than 100MB.",
        variant: "destructive",
      });
      return;
    }
    
    setFile(file);
  };
  
  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
    setSizeWarning(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + 5;
        if (newProgress >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return newProgress;
      });
    }, 200);
    
    try {
      // Process the recording with our updated storage approach
      const recording = await processRecording(file);
      
      // Clear the interval if it's still running
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast({
        title: "Upload complete",
        description: "Your file has been processed successfully!",
      });
      
      // Navigate to analysis page
      navigate(`/analysis/${recording.id}`);
    } catch (error) {
      console.error("Error processing upload:", error);
      clearInterval(progressInterval);
      
      // More specific error message based on the error type
      let errorMessage = "Failed to process your file. Please try again.";
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Upload Recording</h1>
        <p className="text-muted-foreground">
          Upload an existing video or audio file for speech analysis.
        </p>
      </div>
      
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 transition-colors flex flex-col items-center justify-center
            ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"}
            ${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          style={{ minHeight: "300px" }}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".mp4,.webm,.mov,.mp3,.wav,.ogg"
            onChange={handleFileInputChange}
            disabled={isProcessing}
          />
          
          <UploadIcon className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-xl font-medium mb-2">Drag and drop your file here</h3>
          <p className="text-muted-foreground text-center mb-4">
            or click to browse your files<br />
            Supported formats: MP4, WebM, MOV, MP3, WAV, OGG (max 100MB)
          </p>
          <Button disabled={isProcessing}>
            Select File
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              {file.type.startsWith("video") ? (
                <FileVideo className="h-10 w-10 text-primary mr-4" />
              ) : (
                <FileAudio className="h-10 w-10 text-primary mr-4" />
              )}
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={removeFile}
              disabled={isProcessing}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {sizeWarning && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                This file is quite large and may cause browser storage limitations.
                Consider using a smaller file for better performance.
              </AlertDescription>
            </Alert>
          )}
          
          {uploadProgress > 0 && (
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Uploading...</span>
                <span className="text-sm">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          
          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={removeFile}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </>
              ) : (
                "Upload and Process"
              )}
            </Button>
          </div>
        </div>
      )}
      
      <div className="mt-8 bg-muted p-6 rounded-lg">
        <h3 className="text-lg font-medium mb-2">File Requirements</h3>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li>Videos should be between 30 seconds and 5 minutes in length</li>
          <li>For best results, ensure clear audio with minimal background noise</li>
          <li>If uploading video, ensure good lighting and framing</li>
          <li>Supported formats: MP4, WebM, MOV, MP3, WAV, OGG</li>
          <li>Maximum file size: 100MB (recommended: under 20MB)</li>
          <li>Larger files may exceed browser storage limits</li>
        </ul>
      </div>
    </div>
  );
}
