import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, X, FileVideo, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { processRecording } from "@/services/api";

export default function Upload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
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
    
    // Create preview URL for video files
    if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };
  
  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
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
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return newProgress;
      });
    }, 20);
    
    try {
      const recording = await processRecording(file);
      
      // Create a new blob from the file
      const fileBlob = new Blob([file], { type: file.type });
      const blobUrl = URL.createObjectURL(fileBlob);

      // Store all necessary data
      const recordingData = {
        id: recording.id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        blobUrl: blobUrl,
        // If you have a preview URL for video, include it
        previewUrl: file.type.startsWith('video/') ? blobUrl : null
      };

      // Store in localStorage
      localStorage.setItem('recordingData', JSON.stringify(recordingData));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast({
        title: "Upload complete",
        description: "Your file has been processed successfully!",
      });
      
      // Navigate with state as backup
      navigate(`/analysis/${recording.id}`, {
        state: recordingData
      });
    } catch (error) {
      console.error("Error processing upload:", error);
      clearInterval(progressInterval);
      toast({
        title: "Upload Failed",
        description: "Failed to process your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Add cleanup on component unmount
  useEffect(() => {
    return () => {
      // Cleanup preview URL when component unmounts
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  
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
            <div className="flex-1">
              {file.type.startsWith('video') && previewUrl ? (
                <video 
                  className="w-full max-h-[400px] rounded-lg mb-4" 
                  src={previewUrl} 
                  controls
                />
              ) : (
                <div className="flex items-center">
                  <FileAudio className="h-10 w-10 text-primary mr-4" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type}
                    </p>
                  </div>
                </div>
              )}
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
          <li>Maximum file size: 100MB</li>
        </ul>
      </div>
    </div>
  );
}
