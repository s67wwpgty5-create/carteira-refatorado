/**
 * Portfolio Table Component
 * Main table with filtering, sorting, and selection
 */

'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ArrowUpRight } from 'lucide-react';
import { Client, frequency, classify, brl } from '@/lib/portfolio';
import { ReactNode } from 'react';

export interface PortfolioTableProps {
  clients: Client[];
  selectedIds: string[];
  pageSize: number;
  currentPage: number;
  totalPages: number;
  onSelectAll: (selected: boolean) => void;
  onSelectClient: (id: string, selected: boolean) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onClientClick: (client: Client) => void;
  renderActions: (client: Client) => ReactNode;
  closedThrough: string;
  abc: Map<string, { abc: string; value: number }>;
  contacts: Record<string, any>;
  regionName: (value?: string) => string;
  partial: boolean;
}

export function PortfolioTable({
  clients,
  selectedIds,
  pageSize,
  currentPage,
  totalPages,
  onSelectAll,
  onSelectClient,
  onPageChange,
  onPageSizeChange,
  onClientClick,
  renderActions,
  closedThrough,
  abc,
  contacts,
  regionName,
  partial,
}: PortfolioTableProps) {
  const selectedInPage = clients.filter(c => selectedIds.includes(c.id)).length;
  const allSelectedInPage = clients.length > 0 && selectedInPage === clients.length;
  const partiallySelected = selectedInPage > 0 && !allSelectedInPage;

  const evaluate = (c: Client) => {
    if (c.months[closedThrough]?.items) return 'normal';
    let seq = 0;
    let m = closedThrough;
    while (c.months[m]?.items) {
      seq++;
      const [y, month] = m.split('-').map(Number);
      m = month === 1 ? `${y - 1}-12` : `${y}-${String(month - 1).padStart(2, '0')}`;
    }
    return seq >= 2 ? 'forte' : seq === 1 ? 'ausencia' : 'normal';
  };

  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, clients.length);
  const shownClients = clients.slice(startIndex, endIndex);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead style={{ width: '40px' }}>
              <Checkbox
                checked={allSelectedInPage}
                indeterminate={partiallySelected}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Frequência / ABC</TableHead>
            <TableHead>Alerta</TableHead>
            <TableHead>Valor até fechamento</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {shownClients.map(c => {
            const freq = frequency(c, closedThrough);
            const abcData = abc.get(c.id);
            const alert = partial ? 'Parcial' : evaluate(c) === 'forte' ? 'Mais forte' : evaluate(c) === 'ausencia' ? 'Ausência' : 'Sem alerta';

            return (
              <TableRow key={c.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(c.id)}
                    onCheckedChange={v => onSelectClient(c.id, !!v)}
                  />
                </TableCell>

                <TableCell>
                  <button
                    className="client-name"
                    onClick={() => onClientClick(c)}
                  >
                    {c.name}
                    <ArrowUpRight size={14} />
                  </button>
                  <small className="block">
                    {c.document || 'Documento não informado'} · Cód. {c.id} ·{' '}
                    {regionName(contacts[c.id]?.region || contacts[c.id]?.city) || 'Região / cidade não informada'} ·{' '}
                    {c.contract || 'Não localizado'}
                  </small>
                </TableCell>

                <TableCell>
                  {freq.label}
                  <small className="block">
                    {freq.n} meses · Classe {abcData?.abc || 'N/A'}
                  </small>
                </TableCell>

                <TableCell>
                  <span className={`badge ${evaluate(c)}`}>
                    {alert}
                  </span>
                </TableCell>

                <TableCell>
                  {brl(abcData?.value || 0)}
                </TableCell>

                <TableCell>
                  {renderActions(c)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {clients.length === 0 && (
        <p className="empty">Nenhum cliente neste filtro.</p>
      )}

      <div className="pagination">
        <div>
          <span id="companies-page-label">Empresas por página</span>
          <Select value={String(pageSize)} onValueChange={v => onPageSizeChange(Number(v))}>
            <SelectTrigger aria-labelledby="companies-page-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[20, 50, 100, 150].map(n => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span>
          {clients.length ? startIndex + 1 : 0}–{endIndex} de {clients.length} empresas
        </span>

        <Button variant="outline" disabled={currentPage === 0} onClick={() => onPageChange(currentPage - 1)}>
          Anterior
        </Button>

        <span>
          Página {currentPage + 1} de {totalPages}
        </span>

        <Button variant="outline" disabled={currentPage + 1 >= totalPages} onClick={() => onPageChange(currentPage + 1)}>
          Próxima
        </Button>
      </div>
    </>
  );
}
