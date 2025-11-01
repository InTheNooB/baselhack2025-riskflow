import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProducts } from "@/features/survey/survey-actions";
import {
  Shield,
  Heart,
  Home as HomeIcon,
  Car,
  Briefcase,
  ArrowRight,
  Accessibility,
} from "lucide-react";

// Map product names to icons (fallback to Shield if not found)
const getProductIcon = (productName: string) => {
  const name = productName.toLowerCase();
  if (name.includes("life") || name.includes("term")) return Shield;
  if (name.includes("health")) return Heart;
  if (name.includes("home") || name.includes("property")) return HomeIcon;
  if (name.includes("auto") || name.includes("car")) return Car;
  if (name.includes("business") || name.includes("liability")) return Briefcase;
  if (name.includes("disability")) return Accessibility;
  return Shield;
};

export default async function Home() {
  const { products } = await getProducts();

  // Find Term Life Insurance product for redirect (since all products use the same form)
  const termLifeProduct =
    products.find(
      (p) =>
        p.name.toLowerCase().includes("term life") ||
        p.name.toLowerCase().includes("life")
    ) || products[0]; // Fallback to first product if Term Life not found
  const defaultSurveyId = termLifeProduct?.id;

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-semibold">
              <span className="text-[#22c55e]">.Pax</span>
              <span className="text-gray-900"> RiskFlow</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4 tracking-tight">
            Choose Your Insurance Product
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Select an insurance product below to begin your application.
          </p>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-600">
                No insurance products are currently available.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Please contact support or try again later.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const Icon = getProductIcon(product.name);
              return (
                <Card
                  key={product.id}
                  className="hover:shadow-md transition-shadow duration-200 border border-gray-200 bg-white flex flex-col"
                >
                  <CardHeader className="pb-4 flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <Icon className="h-6 w-6 text-[#22c55e]" />
                      <div className="p-3 rounded-lg bg-[#f8faf8]"></div>
                      <CardTitle className="text-xl font-semibold text-gray-900">
                        {product.name}
                      </CardTitle>
                    </div>
                    {product.description && (
                      <CardDescription className="text-gray-600 leading-relaxed">
                        {product.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 mt-auto">
                    <Link
                      href={
                        defaultSurveyId
                          ? `/survey/${defaultSurveyId}`
                          : `/survey/${product.id}`
                      }
                    >
                      <Button variant="outline" className="w-full">
                        Start Application
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Footer Note */}
        {products.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
              All applications are processed using our advanced AI underwriting
              system
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
