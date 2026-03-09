import { useNavigate } from "react-router-dom";
import { Search, Briefcase, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          QMAPS
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-md">
          Connect with trusted local professionals — or find your next client.
        </p>

        <div className="mt-10 w-full max-w-sm space-y-4">
          <Button
            size="lg"
            className="w-full h-14 rounded-xl text-base font-semibold gap-2"
            onClick={() => navigate("/post-job")}
          >
            <Search className="h-5 w-5" />
            Find a Professional
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full h-14 rounded-xl text-base font-semibold gap-2"
            onClick={() => navigate("/auth/welcome")}
          >
            <Briefcase className="h-5 w-5" />
            I'm a Professional
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} FLEXS. All rights reserved.
      </footer>
    </div>
  );
};

export default Index;
