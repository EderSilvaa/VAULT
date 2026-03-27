# Configuração do Sistema de Perfis

Este documento contém as instruções para configurar o sistema de perfis de usuário no Vault.

## 📋 O que foi implementado

- ✅ Página de perfil completa (`/profile`)
- ✅ Upload de foto de perfil
- ✅ Edição de informações pessoais (nome, telefone, endereço)
- ✅ Exibição do avatar no header do Dashboard
- ✅ Navegação do botão "Perfil" para a página de configurações

## 🗄️ Configuração do Banco de Dados

Para ativar o sistema de perfis, você precisa executar a migration no Supabase.

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo:
   ```
   supabase/migrations/20250119_profiles_system.sql
   ```
6. Clique em **Run** para executar a migration

### Opção 2: Via Supabase CLI (se instalado)

```bash
supabase db push
```

## 📁 Storage Configuration

A migration cria automaticamente:

- **Bucket**: `profiles` (público)
- **Estrutura**: `avatars/{user_id}-{timestamp}.{ext}`
- **Limite**: 2MB por imagem
- **Formatos**: JPG, PNG, GIF

## 🔐 Políticas de Segurança (RLS)

A migration configura automaticamente:

✅ **Tabela `profiles`**:
- Usuários podem ver apenas seu próprio perfil
- Usuários podem criar/atualizar/deletar apenas seu próprio perfil

✅ **Storage `profiles`**:
- Todos podem ver avatares (público)
- Usuários podem fazer upload apenas de seus próprios avatares
- Usuários podem atualizar/deletar apenas seus próprios avatares

## 🚀 Funcionalidades da Página de Perfil

### Upload de Foto
- Clique no ícone de câmera sobre o avatar
- Selecione uma imagem (máx. 2MB)
- A foto é carregada automaticamente no Supabase Storage
- Preview em tempo real

### Edição de Informações
- **Email**: Somente leitura (vinculado ao auth)
- **Nome Completo**: Editável
- **Telefone**: Editável (formato livre)
- **Endereço**: Editável

### Sincronização Automática
- Quando um novo usuário faz signup, um perfil é criado automaticamente
- O avatar aparece imediatamente no header após upload

## 🎨 UI/UX

- Design responsivo para mobile e desktop
- Glassmorphism consistente com o resto da aplicação
- Validação de arquivos (tipo e tamanho)
- Feedback visual durante uploads
- Toasts informativos

## 📱 Rotas Adicionadas

- `/profile` - Página de configurações de perfil (protegida)

## 🔄 Integração com o Dashboard

O Dashboard agora:
1. Busca o avatar do usuário ao carregar
2. Exibe a foto no círculo do header (ou ícone padrão)
3. Navega para `/profile` ao clicar em "Perfil" no menu

## ⚠️ Importante

- Execute a migration **antes** de usar o sistema de perfis
- Certifique-se de que o bucket `profiles` foi criado corretamente
- Verifique as políticas RLS no dashboard do Supabase

## 🐛 Troubleshooting

### "Error fetching avatar"
- Verifique se a migration foi executada
- Confirme que a tabela `profiles` existe

### "Error uploading avatar"
- Verifique se o bucket `profiles` existe e é público
- Confirme as políticas RLS do storage

### "Unauthorized"
- Verifique se o usuário está autenticado
- Confirme que as políticas RLS estão corretas

## 📝 Próximos Passos Sugeridos

- [ ] Adicionar crop de imagem antes do upload
- [ ] Permitir remover foto de perfil
- [ ] Adicionar mais campos personalizáveis
- [ ] Implementar temas personalizados
- [ ] Adicionar preferências de notificação
