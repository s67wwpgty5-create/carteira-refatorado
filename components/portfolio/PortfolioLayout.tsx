/**
 * Portfolio Layout Component
 * Main structure with sidebar and content area
 */

'use client';

import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { LayoutDashboard, Bell, ChartNoAxesCombined, Upload, MessageCircle, FileText, Users } from 'lucide-react';
import { ReactNode } from 'react';

export type ViewType = 'Visão geral' | 'Clientes' | 'Alertas' | 'Curva ABC' | 'Acompanhamento' | 'Propostas' | 'Públicos e agendamentos' | 'Importar planilha';

const NAV_ITEMS: Array<[ViewType, typeof LayoutDashboard]> = [
  ['Visão geral', LayoutDashboard],
  ['Clientes', Users],
  ['Alertas', Bell],
  ['Curva ABC', ChartNoAxesCombined],
  ['Acompanhamento', MessageCircle],
  ['Propostas', FileText],
  ['Públicos e agendamentos', MessageCircle],
  ['Importar planilha', Upload],
];

export interface PortfolioLayoutProps {
  currentView: ViewType;
  clientCount: number;
  onViewChange: (view: ViewType) => void;
  headerActions?: ReactNode;
  children: ReactNode;
}

export function PortfolioLayout({
  currentView,
  clientCount,
  onViewChange,
  headerActions,
  children,
}: PortfolioLayoutProps) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="brand">
            <ChartNoAxesCombined />
            <span>
              Controle de<br />
              <strong>Carteira</strong>
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {NAV_ITEMS.map(([label, Icon]) => (
              <SidebarMenuItem key={label}>
                <SidebarMenuButton
                  isActive={currentView === label}
                  onClick={() => onViewChange(label)}
                >
                  <Icon />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>

          <div className="sidebar-note">
            Base real · {clientCount.toLocaleString('pt-BR')} clientes<br />
            Acesso privado
          </div>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="topbar">
          <SidebarTrigger />
          <span>Gestão comercial</span>
          <div className="spacer" />
          {headerActions}
        </header>

        <main className="workspace">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
