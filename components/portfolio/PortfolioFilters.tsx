/**
 * Portfolio Filters Component
 * Handles region, contract, month, risk, ABC, and frequency filters
 */

'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Upload } from 'lucide-react';

export interface FilterState {
  region: string;
  contract: string;
  month: string;
  risk: string;
  abc: string;
  frequency: string;
}

export interface PortfolioFiltersProps {
  filters: FilterState;
  regionOptions: Array<[string, string]>;
  months: string[];
  monthLabel: (month: string) => string;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onImportClick: () => void;
  partial: boolean;
  monthCoverage?: Record<string, boolean>;
  closedThrough: string;
}

export function PortfolioFilters({
  filters,
  regionOptions,
  months,
  monthLabel,
  onFilterChange,
  onImportClick,
  partial,
  monthCoverage,
  closedThrough,
}: PortfolioFiltersProps) {
  const contractOptions = [
    ['all', 'Todos os vínculos'],
    ['Contrato', 'Contrato'],
    ['Não Contrato', 'Não contrato'],
    ['Não localizado', 'Não localizado'],
    ['Não informado', 'Não informado'],
    ['Cancelado', 'Cancelado'],
    ['Vencido', 'Vencido'],
  ] as const;

  const riskOptions = [
    ['all', 'Todos os alertas'],
    ['forte', 'Mais forte'],
    ['ausencia', 'Ausência'],
    ['normal', 'Sem alerta'],
  ] as const;

  const abcOptions = [
    ['all', 'Todas as classes ABC'],
    ...['A', 'B', 'C', 'Sem valor'].map(a => [a, a] as const),
  ];

  const frequencyOptions = [
    ['all', 'Todas as frequências'],
    ...['Eventual', 'Ocasional', 'Frequente', 'Muito frequente', 'Sem histórico'].map(f => [f, f] as const),
  ];

  const regionMenuOptions = [
    ['all', 'Todas as regiões / cidades'],
    ['unset', 'Região / cidade não informada'],
    ...regionOptions.map(([key, label]) => [`region:${key}`, label] as const),
  ];

  return (
    <div className="filters-container">
      <div role="group" aria-label="Filtro por região">
        <Select value={filters.region} onValueChange={(v) => onFilterChange('region', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {regionMenuOptions.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div role="group" aria-label="Filtro por contrato">
        <Select value={filters.contract} onValueChange={(v) => onFilterChange('contract', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {contractOptions.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Select value={filters.month} onValueChange={(v) => onFilterChange('month', v)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m} value={m}>
              {monthLabel(m)}
              {(monthCoverage?.[m] === false || m > closedThrough) && ' · parcial'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={onImportClick}>
        <Upload />
        Importar planilha
      </Button>

      <Select value={filters.risk} onValueChange={(v) => onFilterChange('risk', v)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {riskOptions.map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.abc} onValueChange={(v) => onFilterChange('abc', v)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {abcOptions.map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.frequency} onValueChange={(v) => onFilterChange('frequency', v)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {frequencyOptions.map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
