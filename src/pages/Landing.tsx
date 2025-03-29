
import { AuthForms } from "@/components/AuthForms";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Mic, BarChart, Brain } from "lucide-react";

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid md:grid-cols-2 gap-12 items-center min-h-[80vh]">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
            Improve Your Public Speaking
          </h1>
          <p className="text-xl text-muted-foreground">
            Digital Toastmasters uses AI to analyze your speeches and provide
            personalized feedback to improve your communication skills.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <p className="text-lg">Record or upload your presentations</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <BarChart className="h-6 w-6 text-primary" />
              </div>
              <p className="text-lg">Get detailed metrics and analytics</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <p className="text-lg">Receive AI-powered feedback</p>
            </div>
          </div>
        </div>
        
        <div className="bg-background rounded-lg border shadow-sm p-6">
          <AuthForms />
        </div>
      </div>
    </div>
  );
}
