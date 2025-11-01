import { getProductQuestions, getProducts } from "@/features/survey/survey-actions";
import { notFound } from "next/navigation";
import SurveyForm from "./survey-form";

interface SurveyPageProps {
  params: Promise<{ productId: string }>;
}

export default async function SurveyPage({
  params,
}: SurveyPageProps) {
  const { productId } = await params;

  // Verify product exists
  const { products } = await getProducts();
  const product = products.find((p) => p.id === productId);

  if (!product) {
    notFound();
  }

  // Get questions for this product
  const { questions } = await getProductQuestions(productId);

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Survey Not Available</h1>
          <p className="text-muted-foreground mt-2">
            This product doesn&apos;t have a survey configured yet.
          </p>
        </div>
      </div>
    );
  }

  return <SurveyForm productId={productId} questions={questions} />;
}

