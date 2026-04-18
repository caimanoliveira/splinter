import type { ComponentType } from 'react';
import type { Etapa, EtapaResposta, TrilhaSlug } from '@/types/portal';
import ConteudoWidget from '@/components/trilhas/widgets/ConteudoWidget';

export interface WidgetProps {
  trilhaSlug: TrilhaSlug;
  etapa: Etapa;
  resposta: EtapaResposta | null;
  contextoTrilhaRespostas: EtapaResposta[];
}

export const widgetRegistry: Record<string, ComponentType<WidgetProps>> = {
  conteudo: ConteudoWidget,
};
