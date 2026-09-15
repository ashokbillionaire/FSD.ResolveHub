import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
        <FileQuestion className="size-7 text-slate-400" aria-hidden />
      </span>

      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
        Page not found
      </h1>

      <p className="mt-2 max-w-md text-sm text-slate-600">
        The page or complaint you are looking for does not exist, or you do not
        have permission to view it.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard" className={buttonClasses("primary", "md")}>
          <Home className="size-4" aria-hidden />
          Go to dashboard
        </Link>
        <Link href="/" className={buttonClasses("outline", "md")}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
