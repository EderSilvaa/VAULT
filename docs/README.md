# 📚 Documentação - Vault Caixa Alerta

Esta pasta contém toda a documentação técnica do projeto.

## 📖 Índice da Documentação

### 🏗️ Arquitetura e Estrutura

- **[ARQUITETURA.md](ARQUITETURA.md)** - Documentação completa da arquitetura do sistema
  - Stack tecnológica
  - Estrutura de camadas
  - Schema do banco de dados
  - Fluxos de dados
  - Recursos principais

### ⚙️ Setup e Configuração

- **[SETUP.md](SETUP.md)** - Guia completo de configuração inicial
  - Configuração do Supabase
  - Variáveis de ambiente
  - Primeiros passos

### 🏦 Integrações Bancárias

- **[OPEN_FINANCE_INTEGRATION.md](OPEN_FINANCE_INTEGRATION.md)** - Documentação Open Finance Brasil
  - Visão geral do Open Finance
  - Provedores disponíveis
  - Conformidade regulatória

- **[PLUGGY_SETUP.md](PLUGGY_SETUP.md)** - Como obter credenciais do Pluggy
  - Passo a passo para criar conta
  - Configuração das credenciais
  - Testes com sandbox

- **[DDA_INTEGRATION.md](DDA_INTEGRATION.md)** - Integração DDA (Débito Direto Autorizado)
  - O que é DDA
  - Casos de uso
  - Plano de implementação futura

### 🤖 Inteligência Artificial

- **[AI_INTEGRATION.md](AI_INTEGRATION.md)** - Documentação da integração OpenAI GPT-4o
  - Funcionalidades de IA
  - Arquitetura técnica
  - Custos estimados
  - Troubleshooting

- **[OPENAI_SETUP.md](OPENAI_SETUP.md)** - Como obter API Key do OpenAI
  - Criar conta na OpenAI
  - Configurar método de pagamento
  - Limites de gasto
  - Segurança

- **[TESTE_IA.md](TESTE_IA.md)** - Como testar a análise de IA
  - Passo a passo para testes
  - Exemplos de insights
  - Verificação no console

### 🔒 Conformidade e Segurança

- **[CONSENT_VERIFICATION.md](CONSENT_VERIFICATION.md)** - Sistema de consentimento LGPD
  - Modal de consentimento implementado
  - Rastreamento no banco de dados
  - Conformidade LGPD e Open Finance Brasil
  - Fluxo de consentimento

- **[MIGRATION_INSTRUCTIONS.md](MIGRATION_INSTRUCTIONS.md)** - Instruções de migração de consentimento
  - Como executar migrations
  - Verificações de integridade

### 🗑️ Manutenção

- **[ARQUIVOS_PARA_DELETAR_FINAL.md](ARQUIVOS_PARA_DELETAR_FINAL.md)** - Histórico de limpeza de código
  - Análise de arquivos não utilizados
  - Resultado da limpeza executada
  - 39 arquivos deletados (~1.5MB)

---

## 📊 Organização da Documentação

A documentação está organizada por categoria para facilitar a navegação:

```
docs/
├── README.md (este arquivo)
├── Arquitetura/
│   └── ARQUITETURA.md
├── Setup/
│   └── SETUP.md
├── Integrações/
│   ├── OPEN_FINANCE_INTEGRATION.md
│   ├── PLUGGY_SETUP.md
│   └── DDA_INTEGRATION.md
├── IA/
│   ├── AI_INTEGRATION.md
│   ├── OPENAI_SETUP.md
│   └── TESTE_IA.md
├── Conformidade/
│   ├── CONSENT_VERIFICATION.md
│   └── MIGRATION_INSTRUCTIONS.md
└── Manutenção/
    └── ARQUIVOS_PARA_DELETAR_FINAL.md
```

---

## 🚀 Começando

Se você é novo no projeto, recomendamos ler nesta ordem:

1. **[ARQUITETURA.md](ARQUITETURA.md)** - Entenda a estrutura geral
2. **[SETUP.md](SETUP.md)** - Configure o ambiente
3. **[PLUGGY_SETUP.md](PLUGGY_SETUP.md)** - Configure Open Finance
4. **[OPENAI_SETUP.md](OPENAI_SETUP.md)** - Configure a IA (opcional)
5. **[CONSENT_VERIFICATION.md](CONSENT_VERIFICATION.md)** - Entenda a conformidade LGPD

---

## 📝 Contribuindo com a Documentação

Ao adicionar nova documentação:

1. Crie o arquivo .md na pasta `docs/`
2. Adicione uma entrada neste README.md
3. Use formatação Markdown clara
4. Inclua exemplos quando possível
5. Mantenha a documentação atualizada

---

**Última atualização:** 2025-11-12
**Versão do projeto:** 1.0.0
