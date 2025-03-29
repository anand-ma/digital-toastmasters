
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Upload, Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserRecordings, Recording } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recentRecordings, setRecentRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load recordings on mount
  useState(() => {
    const loadRecordings = async () => {
      setIsLoading(true);
      try {
        const recordings = await getUserRecordings();
        setRecentRecordings(recordings);
      } catch (error) {
        toast({
          title: "Error loading recordings",
          description: "Failed to load your recent recordings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecordings();
  });

  const handleRecordNow = () => {
    navigate("/record");
  };

  const handleUpload = () => {
    navigate("/upload");
  };

  const handleViewRecording = (id: string) => {
    navigate(`/analysis/${id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-primary">Your Dashboard</h1>
      
      {/* Main Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card className="hover:shadow-md transition-shadow hover:border-primary/20">
          <CardHeader>
            <CardTitle>Record New Speech</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="p-4 rounded-full bg-primary/10">
                <Mic className="h-12 w-12 text-primary" />
              </div>
              <p className="text-muted-foreground text-center max-w-xs">
                Record yourself speaking with your camera and microphone.
              </p>
              <Button onClick={handleRecordNow} className="w-full max-w-xs">
                Record Now
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow hover:border-primary/20">
          <CardHeader>
            <CardTitle>Upload Recording</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="p-4 rounded-full bg-primary/10">
                <Upload className="h-12 w-12 text-primary" />
              </div>
              <p className="text-muted-foreground text-center max-w-xs">
                Upload an existing audio or video file for analysis.
              </p>
              <Button onClick={handleUpload} variant="outline" className="w-full max-w-xs">
                Upload File
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Recordings */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Recent Recordings</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/history")}>
            View All
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : recentRecordings.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentRecordings.map((recording) => (
              <Card key={recording.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => handleViewRecording(recording.id)}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">{recording.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(recording.date).toLocaleDateString()}</span>
                    </div>
                    <div>
                      {recording.duration}s
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {recording.analysis?.overallScore || '?'}/100
                      </div>
                      <span className="text-sm font-medium">Score</span>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">
              You don't have any recordings yet. Start by recording or uploading your first speech.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
