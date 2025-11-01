import { getProducts } from "@/features/survey/survey-actions";
import { redirect } from "next/navigation";
import ProductSelection from "./product-selection";

export default async function SurveyPage() {
  const { products } = await getProducts();

  if (products.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">No Products Available</h1>
          <p className="text-muted-foreground mt-2">
            Please contact support or try again later.
          </p>
        </div>
      </div>
    );
  }

  // If only one product, redirect directly to that survey
  if (products.length === 1) {
    redirect(`/survey/${products[0].id}`);
  }

  return <ProductSelection products={products} />;
}
