"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  description: string | null;
}

interface ProductSelectionProps {
  products: Product[];
}

export default function ProductSelection({ products }: ProductSelectionProps) {
  return (
    <div className="container mx-auto py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Apply for Insurance</h1>
        <p className="text-muted-foreground mt-2">
          Select a product to begin your application
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {products.map((product) => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              {product.description && (
                <CardDescription>{product.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Link href={`/survey/${product.id}`}>
                <Button className="w-full">Start Application</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

