import { FolderX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <FolderX className="size-16 text-muted-foreground/50" />
      <h2 className="mt-4 text-2xl font-semibold">Content Not Found</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        We couldn’t find the content you’re looking for. It might have been removed or you may not have access.
      </p>
      <Link href="/" className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90" >
        Go Home
      </Link>
    </div>
  );
}