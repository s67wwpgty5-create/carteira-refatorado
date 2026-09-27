/**
 * Custom Hook: usePortfolioState
 * Centralizes portfolio state management
 */

import { useState, useCallback, useEffect } from 'react';
import { Dataset, Client } from '@/lib/portfolio';

export interface Contact {
  phone: string;
  email: string;
  owner: string;
  region?: string;
  city?: string;
  commercialPhone?: string;
  emails?: string[];
  phones?: string[];
  contactSource?: string;
}

export interface Activity {
  id: string;
  client: string;
  note: string;
  due: string;
  created: string;
  done?: boolean;
}

export interface PortfolioState {
  data: Dataset | null;
  contacts: Record<string, Contact>;
  activities: Activity[];
  status: string;
  loading: boolean;
  error: string | null;
}

export interface PortfolioActions {
  setData: (data: Dataset) => void;
  setContacts: (contacts: Record<string, Contact>) => void;
  setActivities: (activities: Activity[]) => void;
  setStatus: (status: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateContact: (clientId: string, contact: Contact) => void;
  addActivity: (activity: Activity) => void;
  completeActivity: (activityId: string) => void;
  save: (action: string, payload: unknown) => Promise<any>;
}

const BLANK_CONTACT: Contact = {
  phone: '',
  email: '',
  owner: '',
  region: '',
};

export function usePortfolioState(initialData: Dataset): [PortfolioState, PortfolioActions] {
  const [state, setState] = useState<PortfolioState>({
    data: initialData,
    contacts: {},
    activities: [],
    status: '',
    loading: false,
    error: null,
  });

  // Fetch initial data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true }));
        const response = await fetch('/api/portfolio');
        if (!response.ok) throw new Error('Failed to fetch portfolio');

        const data: any = await response.json();
        setState(prev => ({
          ...prev,
          data: data.dataset || prev.data,
          contacts: data.contacts || {},
          activities: data.activities || [],
          loading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Histórico disponível. Não foi possível carregar os acompanhamentos salvos.',
        }));
      }
    };

    fetchData();
  }, []);

  const save = useCallback(async (action: string, payload: unknown) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });

      const data: any = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível salvar');
      }

      setState(prev => ({
        ...prev,
        status: 'Salvo com sucesso.',
        loading: false,
      }));

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({
        ...prev,
        status: errorMessage,
        loading: false,
      }));
      return null;
    }
  }, []);

  const actions: PortfolioActions = {
    setData: (data) => setState(prev => ({ ...prev, data })),
    setContacts: (contacts) => setState(prev => ({ ...prev, contacts })),
    setActivities: (activities) => setState(prev => ({ ...prev, activities })),
    setStatus: (status) => setState(prev => ({ ...prev, status })),
    setLoading: (loading) => setState(prev => ({ ...prev, loading })),
    setError: (error) => setState(prev => ({ ...prev, error })),
    updateContact: (clientId, contact) =>
      setState(prev => ({
        ...prev,
        contacts: { ...prev.contacts, [clientId]: contact },
      })),
    addActivity: (activity) =>
      setState(prev => ({
        ...prev,
        activities: [activity, ...prev.activities],
      })),
    completeActivity: (activityId) =>
      setState(prev => ({
        ...prev,
        activities: prev.activities.map(a =>
          a.id === activityId ? { ...a, done: true } : a
        ),
      })),
    save,
  };

  return [state, actions];
}
