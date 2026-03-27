# Guia: Como Obter Credenciais do Pluggy

## Passo 1: Criar Conta no Pluggy (5 minutos)

1. **Acesse**: https://dashboard.pluggy.ai/signup
2. **Cadastre-se** com:
   - Email
   - OU entre com Google/GitHub
3. **Confirme seu email** (verifique a caixa de entrada)

## Passo 2: Acessar o Dashboard

1. **Faça login** em: https://dashboard.pluggy.ai/login
2. Você será redirecionado para o **Dashboard**

## Passo 3: Criar um Aplicativo

1. No dashboard, procure por **"Applications"** ou **"Aplicações"**
2. Clique em **"Create Application"** ou **"Criar Aplicação"**
3. Preencha:
   - **Nome**: Vault Caixa Alerta
   - **Descrição**: Aplicativo de gestão financeira
4. Clique em **"Create"** ou **"Criar"**

## Passo 4: Copiar as Credenciais

Após criar o aplicativo, você verá:

### Client ID
```
Algo parecido com: a1b2c3d4-5678-90ab-cdef-1234567890ab
```

### Client Secret
```
Algo parecido com: sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**IMPORTANTE**: Copie essas credenciais agora! O Client Secret só é mostrado uma vez.

## Passo 5: Adicionar no Projeto

1. **Abra** o arquivo `.env.local` no VS Code
2. **Substitua** as linhas:

**ANTES:**
```env
VITE_PLUGGY_CLIENT_ID=your-pluggy-client-id
VITE_PLUGGY_CLIENT_SECRET=your-pluggy-client-secret
```

**DEPOIS:**
```env
VITE_PLUGGY_CLIENT_ID=cole-aqui-seu-client-id
VITE_PLUGGY_CLIENT_SECRET=cole-aqui-seu-client-secret
```

3. **Salve** o arquivo (Ctrl+S)

## Passo 6: Reiniciar o Servidor

1. **No terminal**, pressione **Ctrl+C** para parar o servidor
2. **Execute** novamente:
   ```bash
   npm run dev
   ```

## Passo 7: Testar

1. **Acesse** http://localhost:8083
2. **Faça login**
3. **Vá para** /bank-connections
4. **Clique em** "Conectar novo banco"
5. **Selecione** "Sandbox Open Finance"
6. **Digite**:
   - Usuário: `user-ok`
   - Senha: `password-ok`

## Credenciais do Pluggy Sandbox

Para testes, você pode usar essas credenciais no formulário de login do banco:

| Usuário | Senha | Resultado |
|---------|-------|-----------|
| `user-ok` | `password-ok` | ✅ Sucesso |
| `user-error` | `password-ok` | ❌ Erro |
| `user-mfa` | `password-ok` | 🔐 MFA |

## Troubleshooting

### Erro: "ErrorCode: UUID"
- ❌ Credenciais incorretas ou não configuradas
- ✅ Verifique se copiou corretamente as credenciais

### Erro: "Failed to authenticate"
- ❌ Client Secret incorreto
- ✅ Recrie o aplicativo e copie novamente

### Erro: "Item was not sync successfully"
- ❌ Credenciais de teste incorretas (`user-ok` / `password-ok`)
- ✅ Digite exatamente como mostrado acima

## Links Úteis

- **Dashboard Pluggy**: https://dashboard.pluggy.ai
- **Documentação**: https://docs.pluggy.ai
- **Status da API**: https://status.pluggy.ai

## Planos do Pluggy

O Pluggy oferece um **plano gratuito** para desenvolvimento:
- ✅ 100 conexões/mês
- ✅ Sandbox ilimitado
- ✅ Todos os bancos sandbox
- ✅ Suporte por email

Perfeito para testar e desenvolver o Vault!
