import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import type { Dispatch, SetStateAction } from 'react';

interface PageSelectorProps {
  total: number;
  pageSize: number;
  page: number;
  loading: boolean;
  setPage: Dispatch<SetStateAction<number>>;
}

export default function PageSelector({
  loading,
  pageSize,
  page,
  total,
  setPage,
}: PageSelectorProps) {
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1 || loading}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1 mx-2 text-sm font-medium text-muted-foreground">
        Page {page} of {totalPages}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => setPage((p) => p + 1)}
        disabled={page >= totalPages || loading}
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
