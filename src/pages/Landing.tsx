
import { useNavigate } from "react-router-dom";
import { ArrowRight, Mic, Upload, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/dashboard");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-6 fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary">
                Master Public Speaking with AI
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Digital Toastmasters helps you analyze and improve your presentation skills with advanced AI feedback.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleGetStarted} size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden shadow-xl bg-gradient-to-br from-primary/30 via-primary/20 to-secondary/30">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Mic className="h-20 w-20 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-secondary/20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" />
                  Record Your Speech
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Record yourself directly in the browser or upload an existing video or audio file.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="slide-up" style={{ animationDelay: "0.2s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Instant Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Our AI transcribes your speech and analyzes it for pace, filler words, grammar, and more.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="slide-up" style={{ animationDelay: "0.4s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-primary" />
                  Detailed Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Get personalized feedback and actionable tips to improve your public speaking skills.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">
            Ready to elevate your public speaking?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join Digital Toastmasters today and turn your presentations from good to great with AI-powered feedback.
          </p>
          <Button onClick={handleGetStarted} size="lg" className="mx-auto">
            Start Your First Analysis
          </Button>
        </div>
      </section>
    </div>
  );
}
