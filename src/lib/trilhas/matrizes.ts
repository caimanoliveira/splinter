export interface Matriz {
  slug: 'pm-ladder' | 'lideranca';
  titulo: string;
  niveis: Array<{ id: number; nome: string }>;
  competencias: Array<{
    id: string;
    nome: string;
    descricao: string;
    descritores: Record<number, string>;
  }>;
}

const pmLadder: Matriz = {
  slug: 'pm-ladder',
  titulo: 'PM Career Ladder',
  niveis: [
    { id: 1, nome: 'APM' },
    { id: 2, nome: 'PM' },
    { id: 3, nome: 'Sr PM' },
    { id: 4, nome: 'Staff PM' },
  ],
  competencias: [],
};

const lideranca: Matriz = {
  slug: 'lideranca',
  titulo: 'Liderança',
  niveis: [
    { id: 1, nome: 'IC' },
    { id: 2, nome: 'Líder de time' },
    { id: 3, nome: 'Gestor' },
    { id: 4, nome: 'Diretor' },
  ],
  competencias: [],
};

export const matrizes: Record<string, Matriz> = {
  'pm-ladder': pmLadder,
  lideranca,
};

export function getMatriz(slug: 'pm-ladder' | 'lideranca'): Matriz {
  return matrizes[slug];
}
