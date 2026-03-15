import { useEffect, useState } from 'react';
import { Users, ShieldBan, Search, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';
import type { PaginatedResponse, Player } from '@fxmanager/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QueryService } from '@/lib/query';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDuration } from '@/lib/utils';
import PageSizeSelector from '@/components/page-size-selector';
import PageSelector from '@/components/page-selector';

type SortBy = 'lastSeen' | 'firstSeen' | 'playtime';
type SortOrder = 'asc' | 'desc';

export default function Players() {
  const [players, setPlayers] = useState<Omit<Player, 'identifiers'>[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('lastSeen');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const debouncedSearch = useDebounce(search, 300);
  const loading = players === null;

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams({
      sortBy,
      sortOrder,
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (debouncedSearch) params.set('search', debouncedSearch);

    QueryService<PaginatedResponse<Omit<Player, 'identifiers'>>>({
      endpoint: `/players?${params.toString()}`,
      method: 'GET',
    }).then((response) => {
      if (cancelled) return;

      const { items, total: newTotal } = response;

      setPlayers(items);
      setTotal(newTotal);
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, sortBy, sortOrder, page, pageSize]);

  useEffect(() => {
    const updatePage = () => setPage(1);
    updatePage();
  }, [debouncedSearch, sortBy, sortOrder]);

  const toggleSortOrder = () => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Players</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or identifier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lastSeen">Last seen</SelectItem>
            <SelectItem value="firstSeen">First seen</SelectItem>
            <SelectItem value="playtime">Playtime</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={toggleSortOrder} className="w-40 justify-between">
          <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>

      <Card className="bg-card/50 pb-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>

              <TableHead className="cursor-pointer select-none">
                <div className="flex items-center gap-1">
                  <span>First seen</span>
                  <div className="w-4 h-4 flex-shrink-0 text-accent">
                    {sortBy === 'firstSeen' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      ))}
                  </div>
                </div>
              </TableHead>

              <TableHead>
                <div className="flex items-center gap-1">
                  <span>Last seen</span>
                  <div className="w-4 h-4 flex-shrink-0 text-accent">
                    {sortBy === 'lastSeen' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      ))}
                  </div>
                </div>
              </TableHead>

              <TableHead>
                <div className="flex items-center gap-1">
                  <span>Playtime</span>
                  <div className="w-4 h-4 flex-shrink-0 text-accent">
                    {sortBy === 'playtime' &&
                      (sortOrder === 'asc' ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      ))}
                  </div>
                </div>
              </TableHead>

              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : players.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {search ? `No players matching "${search}"` : 'No players found'}
                </TableCell>
              </TableRow>
            ) : (
              players.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.name}
                    {p.isStaff && (
                      <Badge variant="link" className="ml-2 text-xs">
                        Staff
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(p.firstSeen).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(p.lastSeen).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDuration(p.playtime)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-destructive hover:text-destructive"
                    >
                      <ShieldBan className="mr-1.5 h-3.5 w-3.5" /> Ban
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-4 py-4 border-t border-border">
          <PageSizeSelector
            pageSize={pageSize}
            setPageSize={setPageSize}
            label="Players per page"
          />

          <PageSelector
            page={page}
            pageSize={pageSize}
            setPage={setPage}
            loading={loading}
            total={total}
          />
        </div>
      </Card>
    </div>
  );
}
