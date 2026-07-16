import Link from "next/link";
import { ClipboardList } from "lucide-react";

export default function AuthBrandHeader() {
  return (
    <Link
      href="/"
      className="mb-8 flex items-center justify-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
        <ClipboardList className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
      </div>
      <span className="text-lg font-semibold tracking-tight text-foreground">
        Hayzedd Forms
      </span>
    </Link>
  );
}
