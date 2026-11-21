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

  useEffect(() => { if (category) document.title = `${category.name}: request quotes | FLEXS`; }, [category]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fx-sunken">
        <div role="status" className="flex flex-col items-center gap-4"><div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" /><p className="text-sm text-fx-secondary">Loading the questions…</p></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-fx-sunken p-4">
        <h1 className="mb-4 text-xl text-fx-ink">Service not found</h1>
        <Button onClick={() => navigate("/post-job")}>Back to services</Button>
      </div>
    );
  }

  // One wizard for every entry point: the same component the service pages open.
  return (
    <div className="min-h-screen bg-fx-sunken">
      <h1 className="sr-only">Request quotes for {category.name}</h1>
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
