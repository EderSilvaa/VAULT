import { TRANSACTION_CATEGORIES } from '@/lib/validations'

type Category = (typeof TRANSACTION_CATEGORIES)[number]

interface CategoryRule {
  category: Category
  type: 'income' | 'expense' | 'both'
  keywords: string[]
}

const CATEGORY_RULES: CategoryRule[] = [
  // Receitas
  {
    category: 'Vendas',
    type: 'income',
    keywords: [
      'venda', 'vendas', 'recebimento', 'faturamento', 'nf ', 'nota fiscal',
      'pix recebido', 'ted recebida', 'deposito', 'depósito', 'crédito',
      'pagamento recebido', 'cliente', 'fatura', 'comissão', 'comissao',
      'recebível', 'recebivel', 'marketplace', 'shopee', 'mercado livre',
      'ifood', 'uber eats', 'rappi', 'stone', 'pagseguro', 'cielo',
      'getnet', 'rede', 'sumup', 'maquininha',
    ],
  },
  {
    category: 'Receita',
    type: 'income',
    keywords: [
      'rendimento', 'juros', 'dividendo', 'reembolso', 'estorno',
      'cashback', 'resgate', 'transferência recebida', 'transferencia recebida',
      'remuneração', 'remuneracao', 'prolabore', 'pró-labore',
    ],
  },

  // Despesas
  {
    category: 'Salários',
    type: 'expense',
    keywords: [
      'salário', 'salario', 'folha', 'funcionário', 'funcionario',
      'holerite', 'férias', 'ferias', '13o', 'décimo terceiro',
      'rescisão', 'rescisao', 'fgts', 'inss patronal', 'vale transporte',
      'vale refeição', 'vale alimentação', 'vr ', 'va ', 'vt ',
      'benefício', 'beneficio', 'plano de saude', 'plano de saúde',
    ],
  },
  {
    category: 'Aluguel',
    type: 'expense',
    keywords: [
      'aluguel', 'locação', 'locacao', 'condomínio', 'condominio',
      'iptu', 'imobiliária', 'imobiliaria', 'sala comercial',
      'escritório', 'escritorio', 'coworking',
    ],
  },
  {
    category: 'Impostos',
    type: 'expense',
    keywords: [
      'imposto', 'das ', 'das-', 'simples nacional', 'darf', 'icms',
      'iss ', 'pis', 'cofins', 'irpj', 'csll', 'inss', 'gps',
      'tributo', 'taxa prefeitura', 'alvará', 'alvara', 'mei',
      'receita federal', 'sefaz',
    ],
  },
  {
    category: 'Fornecedores',
    type: 'expense',
    keywords: [
      'fornecedor', 'matéria prima', 'materia prima', 'insumo',
      'mercadoria', 'estoque', 'compra de', 'atacado', 'distribuidora',
      'embalagem', 'produto para revenda',
    ],
  },
  {
    category: 'Fixo',
    type: 'expense',
    keywords: [
      'internet', 'telefone', 'celular', 'energia', 'luz', 'água', 'agua',
      'conta de luz', 'conta de água', 'cpfl', 'enel', 'sabesp', 'copasa',
      'vivo', 'claro', 'tim', 'oi ', 'net ', 'seguro', 'contabilidade',
      'contador', 'software', 'assinatura', 'mensalidade', 'plano mensal',
      'hospedagem', 'domínio', 'dominio', 'servidor', 'aws', 'google cloud',
      'heroku', 'vercel', 'netflix', 'spotify',
    ],
  },
  {
    category: 'Variável',
    type: 'expense',
    keywords: [
      'combustível', 'combustivel', 'gasolina', 'etanol', 'diesel',
      'uber', '99 ', 'estacionamento', 'pedágio', 'pedagio',
      'manutenção', 'manutencao', 'reparo', 'conserto',
      'material de escritório', 'material escritorio', 'papelaria',
      'limpeza', 'higiene', 'correios', 'frete', 'entrega',
      'alimentação', 'alimentacao', 'refeição', 'refeicao',
      'restaurante', 'lanche', 'supermercado',
    ],
  },
  {
    category: 'Marketing',
    type: 'expense',
    keywords: [
      'marketing', 'propaganda', 'anúncio', 'anuncio', 'google ads',
      'facebook ads', 'meta ads', 'instagram', 'tiktok ads', 'publicidade',
      'agência', 'agencia', 'designer', 'freelancer', 'influenciador',
      'branding', 'flyer', 'panfleto', 'cartão de visita', 'banner',
    ],
  },
  {
    category: 'Serviços',
    type: 'expense',
    keywords: [
      'serviço', 'servico', 'consultoria', 'advocacia', 'advogado',
      'jurídico', 'juridico', 'assessoria', 'treinamento', 'curso',
      'capacitação', 'capacitacao', 'motoboy', 'transporte',
      'terceirizado', 'prestador',
    ],
  },
]

export function categorizeTransaction(
  description: string,
  type: 'income' | 'expense'
): Category {
  const normalized = description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  for (const rule of CATEGORY_RULES) {
    if (rule.type !== 'both' && rule.type !== type) continue

    for (const keyword of rule.keywords) {
      const normalizedKeyword = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (normalized.includes(normalizedKeyword)) {
        return rule.category
      }
    }
  }

  return type === 'income' ? 'Receita' : 'Outros'
}

export function categorizeTransactions(
  transactions: Array<{ description: string; type: 'income' | 'expense' }>
): Category[] {
  return transactions.map((t) => categorizeTransaction(t.description, t.type))
}
