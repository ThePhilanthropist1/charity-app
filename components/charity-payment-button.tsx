"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { PRODUCT_CONFIG } from "@/lib/product-config";
import type { Product } from "@/lib/sdklite-types";

interface CharityPaymentButtonProps {
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function CharityPaymentButton({
  variant = "default",
  size = "default",
  className,
}: CharityPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const piAuth = usePiAuth();
  const { products, sdk } = piAuth || {};

  // Find the charity token product
  const product = products?.find(
    (p) => p.id === PRODUCT_CONFIG.PRODUCT_69c8e7724def080316bed965
  ) as Product | undefined;

  const handlePayment = async () => {
    if (!product || !sdk) {
      setError("Product not available. Please try again.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log("[v0] Starting purchase for product:", product.slug);
      const result = await sdk.makePurchase(product.slug);

      if (result.ok) {
        console.log("[v0] Purchase successful:", result);
        setSuccess(true);
        setError(null);
        // Reset success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError("Purchase failed. Please try again.");
      }
    } catch (err: any) {
      console.error("[v0] Purchase error:", err);
      const errorCode = err?.code;

      if (errorCode === "purchase_cancelled") {
        setError("Payment cancelled.");
      } else if (errorCode === "product_not_found") {
        setError("Product not found.");
      } else if (errorCode === "purchase_error") {
        setError("An error occurred during payment. Please try again.");
      } else {
        setError(err?.message || "An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!product) {
    return (
      <Button
        disabled
        variant={variant}
        size={size}
        className={className}
        title="Product not available"
      >
        Product Unavailable
      </Button>
    );
  }

  const price = product.price_in_pi || 6.0;
  const buttonLabel = `Buy Charity Token - ${price} Pi`;

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handlePayment}
        disabled={isLoading || !sdk}
        variant={variant}
        size={size}
        className={className}
      >
        {isLoading ? (
          <>
            <Spinner className="mr-2 h-4 w-4" />
            Processing...
          </>
        ) : (
          buttonLabel
        )}
      </Button>
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-green-600 bg-green-100 p-2 rounded">
          Purchase successful! You have received your Charity tokens.
        </div>
      )}
    </div>
  );
}
