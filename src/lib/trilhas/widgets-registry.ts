import type { ComponentType } from 'react';
import type { Etapa, EtapaResposta, TrilhaSlug } from '@/types/portal';

export interface WidgetProps {
  trilhaSlug: TrilhaSlug;
  etapa: Etapa;
  resposta: EtapaResposta | null;
  contextoTrilhaRespostas: EtapaResposta[];
}

export const widgetRegistry: Record<string, ComponentType<WidgetProps>> = {};
