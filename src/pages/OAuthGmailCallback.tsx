import { useEffect, useState } from 'react'

/**
 * Receives the OAuth code from Google in a popup window, forwards it to the
 * parent window via postMessage, and closes itself.
 *
 * If opened in a top-level tab (no window.opener), shows a friendly message.
 */
const OAuthGmailCallback = () => {
  const [hasOpener, setHasOpener] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (!window.opener) {
      setHasOpener(false)
      return
    }

    window.opener.postMessage(
      { type: 'gmail-oauth-callback', code, error },
      window.location.origin
    )
    window.close()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-2 max-w-sm">
        {hasOpener ? (
          <>
            <p className="text-lg font-medium">Conectando...</p>
            <p className="text-sm text-muted-foreground">Você pode fechar esta janela.</p>
          </>
        ) : (
          <>
            <p className="text-lg font-medium">Algo deu errado</p>
            <p className="text-sm text-muted-foreground">
              Esta página deve ser aberta a partir do botão "Adicionar conta" no Vault.
              Volte para o app e tente de novo.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default OAuthGmailCallback
