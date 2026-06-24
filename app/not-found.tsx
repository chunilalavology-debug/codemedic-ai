import Link from "next/link";
import { Bug, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Bug className="size-10 text-primary" />
      </div>
      <h1 className="text-6xl font-extrabold text-foreground mb-2">404</h1>
      <p className="text-xl font-semibold text-foreground mb-2">Page not found</p>
      <p className="text-muted-foreground mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className={buttonVariants({ size: "lg" }) + " gradient-primary text-white border-0"}>
        <ArrowLeft className="mr-2 size-4" />
        Back to home
      </Link>
    </div>
  );
}
