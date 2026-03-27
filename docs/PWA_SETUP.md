# PWA (Progressive Web App) - Vault

A Vault agora é um **Progressive Web App (PWA)** completo! 🎉

## ✨ Recursos PWA Implementados

✅ **Instalação no dispositivo** - Funciona como app nativo
✅ **Funcionalidade offline** - Acesso mesmo sem internet
✅ **Cache inteligente** - Carregamento rápido
✅ **Ícones personalizados** - Logo Vault em todos os tamanhos
✅ **Splash screen** - Experiência profissional
✅ **Service Worker** - Workbox para cache otimizado

---

## 📱 Como Instalar o PWA

### No Desktop (Chrome/Edge):

1. Acesse a aplicação no navegador
2. Procure o ícone ➕ ou **"Instalar"** na barra de endereço
3. Clique em **"Instalar Vault"**
4. O app será instalado e abrirá em janela própria
5. Um atalho será criado na área de trabalho

### No Mobile (Android):

1. Abra a Vault no Chrome
2. Toque no menu (⋮) → **"Adicionar à tela inicial"**
3. Toque em **"Adicionar"**
4. O ícone aparecerá na home screen
5. Toque para abrir como app nativo

### No iOS (Safari):

1. Abra a Vault no Safari
2. Toque no botão de **compartilhar** (□↑)
3. Role e toque em **"Adicionar à Tela de Início"**
4. Toque em **"Adicionar"**
5. O app aparecerá na home screen

---

## 🧪 Como Testar o PWA

### 1. Verificar Service Worker

1. Abra DevTools (F12)
2. Vá em **Application** → **Service Workers**
3. Verifique se o service worker está **ativo**
4. Status deve mostrar: **"activated and is running"**

### 2. Testar Modo Offline

1. Abra DevTools (F12)
2. Vá em **Network**
3. Marque **"Offline"**
4. Recarregue a página (F5)
5. A aplicação deve continuar funcionando! ✅

### 3. Verificar Manifest

1. Abra DevTools (F12)
2. Vá em **Application** → **Manifest**
3. Verifique:
   - Nome: **Vault - Caixa Alerta**
   - Cor do tema: **#8B5CF6** (roxo)
   - Ícones: **192x192** e **512x512**
   - Display mode: **standalone**

### 4. Lighthouse PWA Audit

1. Abra DevTools (F12)
2. Vá em **Lighthouse**
3. Selecione **Progressive Web App**
4. Clique em **Generate report**
5. Score deve ser **90+** 🎯

---

## 🎨 Ícones PWA

Os ícones foram gerados automaticamente a partir do logo da Vault:

- **pwa-192x192.png** - Android, Chrome
- **pwa-512x512.png** - Android splash, desktop
- **apple-touch-icon.png** - iOS home screen
- **favicon-16x16.png** - Browser tab (pequeno)
- **favicon-32x32.png** - Browser tab (normal)

### Regerar Ícones

Se precisar alterar o logo:

1. Edite `public/pwa-icon.svg`
2. Execute:
   ```bash
   npm run generate-pwa-icons
   ```

---

## ⚙️ Configuração Técnica

### Manifest (gerado automaticamente)

```json
{
  "name": "Vault - Caixa Alerta",
  "short_name": "Vault",
  "description": "Gestão financeira inteligente com IA",
  "theme_color": "#8B5CF6",
  "background_color": "#ffffff",
  "display": "standalone",
  "scope": "/",
  "start_url": "/",
  "orientation": "portrait"
}
```

### Service Worker

- **Estratégia**: Auto-update (atualiza automaticamente)
- **Cache Supabase**: NetworkFirst (sempre tenta rede primeiro)
- **Cache Fonts**: CacheFirst (prioriza cache)
- **Tempo de cache**: 7 dias (Supabase), 1 ano (fonts)

### Arquivos em Cache

Todos os arquivos estáticos são armazenados em cache:
- **JavaScript** (.js)
- **CSS** (.css)
- **HTML** (.html)
- **Imagens** (.png, .svg, .ico)
- **Fontes** (.woff2)

---

## 🚀 Build para Produção

Para gerar build com PWA:

```bash
npm run build
```

O Vite automaticamente:
1. Gera o **manifest.webmanifest**
2. Cria o **service worker** (sw.js)
3. Injeta código de registro do SW
4. Otimiza os ícones

### Preview do Build

```bash
npm run preview
```

Teste o PWA no ambiente de produção antes de fazer deploy.

---

## 📊 Cache Strategy

### Network First (Supabase)
```
1. Tenta buscar da rede
2. Se falhar, usa cache
3. Sempre atualiza cache com resposta da rede
```
**Ideal para:** Dados dinâmicos que precisam estar atualizados

### Cache First (Google Fonts)
```
1. Verifica cache primeiro
2. Se não existir, busca da rede
3. Armazena no cache para próximas vezes
```
**Ideal para:** Recursos estáticos que raramente mudam

---

## 🔧 Troubleshooting

### PWA não aparece para instalar

1. Verifique se está em **HTTPS** (ou localhost)
2. Confirme que service worker está registrado
3. Veja console para erros
4. Certifique-se que manifest está acessível

### Service Worker não ativa

1. Feche todas as abas da aplicação
2. Abra DevTools → Application → Service Workers
3. Clique em **"Unregister"**
4. Recarregue a página (F5)
5. Aguarde novo SW ser instalado

### Cache não funciona offline

1. Abra DevTools → Application → Cache Storage
2. Verifique se tem caches criados
3. Se vazio, force atualização (Ctrl+Shift+R)
4. Aguarde cache ser populado
5. Teste offline novamente

### Ícones não aparecem

1. Verifique se arquivos PNG existem em `/public`
2. Execute `npm run generate-pwa-icons`
3. Limpe cache do navegador
4. Recarregue aplicação

---

## 📱 Comportamento PWA

### Desktop

- Abre em **janela própria** (sem barra de navegador)
- Aparece na **barra de tarefas** como app separado
- Atalho na **área de trabalho**
- Funciona **offline**

### Mobile

- Ícone na **home screen**
- Splash screen ao abrir
- **Fullscreen** (sem barra do navegador)
- Gestos nativos funcionam
- Funciona **offline**

### Tablet

- Modo **landscape** e **portrait**
- Interface responsiva
- Gestos touch otimizados
- Cache inteligente

---

## 🎯 Checklist PWA

- [x] Manifest configurado
- [x] Service Worker ativo
- [x] Ícones em todos os tamanhos
- [x] Meta tags PWA no HTML
- [x] HTTPS (production)
- [x] Cache strategy definida
- [x] Offline functionality
- [x] Install prompt
- [x] Theme color
- [x] Splash screen

---

## 📖 Referências

- [PWA Builder](https://www.pwabuilder.com/)
- [Workbox Docs](https://developers.google.com/web/tools/workbox)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)

---

## 💡 Dicas

1. **Teste sempre offline** antes de fazer deploy
2. **Use Lighthouse** para verificar score PWA
3. **Limpe cache** durante desenvolvimento
4. **Monitore tamanho** do service worker
5. **Teste em diferentes dispositivos**

---

Agora a Vault funciona como um app nativo! 🎉
