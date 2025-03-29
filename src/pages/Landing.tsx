
import { AuthForms } from "@/components/AuthForms";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Mic, BarChart, Brain, ArrowRight } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const authFormRef = useRef<HTMLDivElement>(null);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Handle focus on auth form when specified in location state
  useEffect(() => {
    if (location.state?.focusAuthForm && authFormRef.current) {
      // Scroll to the auth form with smooth behavior
      authFormRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
      
      // Focus on the first input in the form
      setTimeout(() => {
        const firstInput = authFormRef.current?.querySelector('input');
        if (firstInput) {
          firstInput.focus();
        }
      }, 500); // Small delay to ensure scroll completes
    }
  }, [location.state]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="grid md:grid-cols-2 gap-12 items-center min-h-[80vh]">
        <div className="space-y-8 slide-up">
          <div className="inline-block relative">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Improve Your Public Speaking
            </h1>
            <div className="absolute -bottom-4 left-0 w-36 h-2 bg-secondary rounded-full"></div>
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Digital Toastmasters uses AI to analyze your speeches and provide
            personalized feedback to improve your communication skills.
          </p>
          <div className="space-y-6">
            <div className="flex items-center gap-4 hover:translate-x-2 transition-transform">
              <div className="bg-primary/10 p-3 rounded-full">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <p className="text-lg font-medium">Record or upload your presentations</p>
            </div>
            <div className="flex items-center gap-4 hover:translate-x-2 transition-transform">
              <div className="bg-primary/10 p-3 rounded-full">
                <BarChart className="h-6 w-6 text-primary" />
              </div>
              <p className="text-lg font-medium">Get detailed metrics and analytics</p>
            </div>
            <div className="flex items-center gap-4 hover:translate-x-2 transition-transform">
              <div className="bg-primary/10 p-3 rounded-full">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <p className="text-lg font-medium">Receive AI-powered feedback</p>
            </div>
          </div>
          
          <div className="pt-4">
            <Button 
              size="lg" 
              onClick={() => authFormRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="group"
            >
              Get Started
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col gap-6 fade-in">
          <div className="rounded-2xl overflow-hidden border shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <AspectRatio ratio={16 / 9} className="bg-muted">
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1920&auto=format&fit=crop"
                  alt="People giving presentations and improving public speaking skills"
                  className="object-cover w-full h-full dark:opacity-90"
                />
              </div>
            </AspectRatio>
          </div>
          
          <div className="bg-background rounded-2xl border shadow-lg p-8 hover:shadow-xl transition-all duration-300">
            <AuthForms ref={authFormRef} />
          </div>
        </div>
      </div>
      
      <div className="mt-16 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Digital Toastmasters. All rights reserved.
        </p>
      </div>
    </div>
  );
}
