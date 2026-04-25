import { supabase } from '@/lib/supabase'
import type { ImportedTransaction } from '@/utils/parsers'

export interface GmailAccount {
  id: string
  email: string
  connected_at: string
  last_scan_at: string | null
}

export interface ScanAccountResult {
  email: string
  scanned: number
  found: number
  error?: string
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly'

export const gmailAccountsService = {
  async list(userId: string): Promise<GmailAccount[]> {
    const { data, error } = await supabase
      .from('gmail_accounts' as any)
      .select('id, email, connected_at, last_scan_at')
      .eq('user_id', userId)
      .order('connected_at', { ascending: true })

    if (error) throw error
    return (data ?? []) as unknown as GmailAccount[]
  },

  async disconnect(accountId: string): Promise<void> {
    const { error } = await supabase
      .from('gmail_accounts' as any)
      .delete()
      .eq('id', accountId)
    if (error) throw error
  },

  /**
   * Opens a popup with Google's OAuth consent screen, lets the user pick a Gmail
   * account, and persists the resulting refresh_token via the connect-gmail-account
   * Edge Function. Returns the email address that was just connected.
   *
   * The login session in the Vault is NOT touched — this is a separate OAuth flow
   * scoped only to the gmail.readonly scope.
   */
  async connectAccount(): Promise<{ email: string }> {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error('VITE_GOOGLE_CLIENT_ID não configurado.')
    }

    const redirectUri = `${window.location.origin}/oauth/gmail-callback`

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', GMAIL_SCOPE)
    authUrl.searchParams.set('access_type', 'offline')
    // select_account → forces account picker even if user is logged into one Google
    // consent → forces refresh_token to be reissued (Google only sends it on first consent)
    authUrl.searchParams.set('prompt', 'consent select_account')

    const popup = window.open(
      authUrl.toString(),
      'gmail-oauth',
      'width=520,height=640,menubar=no,toolbar=no'
    )

    if (!popup) throw new Error('Popup bloqueado pelo navegador. Permita popups e tente de novo.')

    return new Promise((resolve, reject) => {
      let settled = false

      const cleanup = () => {
        window.removeEventListener('message', handler)
        clearInterval(closedTimer)
      }

      const handler = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        if (event.data?.type !== 'gmail-oauth-callback') return
        if (settled) return
        settled = true
        cleanup()

        if (event.data.error) {
          reject(new Error(event.data.error))
          return
        }

        try {
          const { data, error } = await supabase.functions.invoke('connect-gmail-account', {
            body: { code: event.data.code, redirect_uri: redirectUri },
          })
          if (error) {
            // Surface the real server-side error message instead of "non-2xx"
            let serverMsg = error.message
            try {
              const ctx: any = (error as any).context
              if (ctx && typeof ctx.json === 'function') {
                const parsed = await ctx.json()
                if (parsed?.error) serverMsg = parsed.error
              }
            } catch { /* fall back to generic message */ }
            throw new Error(serverMsg)
          }
          if (data?.error) throw new Error(data.error)
          resolve({ email: data.email })
        } catch (err: any) {
          reject(err)
        }
      }

      window.addEventListener('message', handler)

      const closedTimer = setInterval(() => {
        if (popup.closed && !settled) {
          settled = true
          cleanup()
          reject(new Error('Janela fechada antes de autorizar.'))
        }
      }, 500)
    })
  },

  /**
   * Scans all Gmail accounts connected for the current user.
   * The Edge Function reads accounts from the DB (server-side) so the user JWT
   * in the Authorization header is enough — no provider tokens passed.
   */
  async scanAll(days = 90): Promise<{
    transactions: ImportedTransaction[]
    scanned: number
    accounts: ScanAccountResult[]
  }> {
    const { data, error } = await supabase.functions.invoke('parse-gmail', {
      body: { days },
    })
    if (error) throw error
    if (data?.error) throw new Error(data.error)

    const transactions: ImportedTransaction[] = (data.transactions ?? []).map((t: any) => ({
      date: t.date,
      amount: t.amount,
      description: t.description,
      type: t.type,
      category: t.category,
      source_id: t.source_id,
      confidence: t.confidence,
      installment: t.installment,
      isRecurring: t.isRecurring,
      raw: { source: t.source },
    }))

    return {
      transactions,
      scanned: data.scanned ?? 0,
      accounts: data.accounts ?? [],
    }
  },
}
