"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface PageHeaderProps {
  title?: string;
  role?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backHref?: string;
  rightAction?: React.ReactNode;
}

export function PageHeader({
  title,
  role = "Underwriter",
  subtitle,
  showBackButton = false,
  backHref,
  rightAction,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-6 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-2 text-gray-700 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <div className="text-2xl font-semibold">
              <Link href="/cases">
                <span className="text-[#22c55e]">.Pax</span>
                <span className="text-gray-900"> RiskFlow</span>
              </Link>
            </div>
            {title && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {rightAction || (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    <Image
                      src="/avatar.jpg"
                      alt="Avatar"
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">
                      Gabriel Chätschgi
                    </p>
                    <p className="text-xs text-gray-500">{role}</p>
                  </div>
                </div>
                <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <Plus className="h-4 w-4 text-gray-600" />
                </button>
                <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <Bell className="h-4 w-4 text-gray-600" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
