import type { ComponentType } from 'react';
import type { Etapa, EtapaResposta, TrilhaSlug } from '@/types/portal';
import ConteudoWidget from '@/components/trilhas/widgets/ConteudoWidget';
import ChecklistWidget from '@/components/trilhas/widgets/ChecklistWidget';
import MatrizWidget from '@/components/trilhas/widgets/MatrizWidget';
import PlanoAcaoWidget from '@/components/trilhas/widgets/PlanoAcaoWidget';
import BancoPerguntasWidget from '@/components/trilhas/widgets/BancoPerguntasWidget';
import StarBuilderWidget from '@/components/trilhas/widgets/StarBuilderWidget';

export interface WidgetProps {
  trilhaSlug: TrilhaSlug;
  etapa: Etapa;
  resposta: EtapaResposta | null;
  contextoTrilhaRespostas: EtapaResposta[];
}

export const widgetRegistry: Record<string, ComponentType<WidgetProps>> = {
  conteudo: ConteudoWidget,
  checklist: ChecklistWidget,
  matriz: MatrizWidget,
  plano_acao: PlanoAcaoWidget,
  banco_perguntas: BancoPerguntasWidget,
  star_builder: StarBuilderWidget,
};
