import { Loader2 } from "lucide-react";

export function LoadingScreen({ message = 'Loading' }: { message?: string }) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">{message}...</p>
        </div>
    )
}