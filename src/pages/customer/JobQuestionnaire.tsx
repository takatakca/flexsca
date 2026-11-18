import ServiceFlowModal from "@/components/customer/ServiceFlowModal";
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Question {
  id: string;
  label: string;
  subtitle?: string;
  type: "radio" | "checkbox" | "textarea" | "location" | "select";
  options: string[];
  required: boolean;
  hasOther?: boolean;
  placeholder?: string;
}


interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  base_credit_cost: number;
  hero_image?: string | null;
  questions: Question[];
}

export default function JobQuestionnaire() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [params]=useSearchParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("service_categories")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single()
      .then(({ data }) => {
        if (data) {
          setCategory({
            ...data,
            questions: (data.questions as unknown as Question[]) || [],
          });
        }
        setLoading(false);
      });
  }, [slug]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fx-sunken">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-fx-sunken p-4">
        <p className="text-muted-foreground mb-4">Service not found</p>
        <Button onClick={() => navigate("/post-job")}>Back to services</Button>
      </div>
    );
  }

  // One wizard for every entry point: the same component the service pages open.
  return (
    <div className="min-h-screen bg-fx-sunken">
      <ServiceFlowModal
        categoryId={category.id}
        categoryName={category.name}
        categorySlug={category.slug}
        questions={category.questions}
        heroImage={category.hero_image}
        initialLocation={params.get("location") ?? ""}
        onClose={() => navigate("/post-job")}
      />
    </div>
  );
}
