import { supabase } from '@/lib/supabase'
import type { ImportedTransaction } from '@/utils/parsers'

export const gmailService = {
  /**
   * Triggers Google OAuth requesting gmail.readonly scope.
   * Redirects back to /import?tab=gmail after consent.
   */
  async connectGmail() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/gmail.readonly',
        redirectTo: `${window.location.origin}/import?tab=gmail`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) throw error
    return data
  },

  /**
   * Returns provider tokens from the current session.
   * provider_token = short-lived access token (~1h)
   * provider_refresh_token = long-lived, used to renew access token
   */
  async getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    const { data } = await supabase.auth.getSession()
    return {
      accessToken: data.session?.provider_token ?? null,
      refreshToken: data.session?.provider_refresh_token ?? null,
    }
  },

  /**
   * Whether the user has a Gmail token (either access or refresh).
   */
  async isConnected(): Promise<boolean> {
    const { accessToken, refreshToken } = await gmailService.getTokens()
    return !!(accessToken || refreshToken)
  },

  /**
   * Saves the refresh token to the user's profile so it persists across sessions.
   * Called automatically after OAuth redirect.
   */
  async saveRefreshToken(userId: string) {
    const { refreshToken } = await gmailService.getTokens()
    if (!refreshToken) return

    await supabase
      .from('profiles')
      .update({ gmail_refresh_token: refreshToken } as any)
      .eq('id', userId)
  },

  /**
   * Loads the persisted refresh token from the profile (fallback when session expires).
   */
  async loadRefreshToken(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('profiles')
      .select('gmail_refresh_token')
      .eq('id', userId)
      .single()
    return (data as any)?.gmail_refresh_token ?? null
  },

  /**
   * Calls the parse-gmail Edge Function.
   * Automatically uses refresh_token if access_token is missing/expired.
   * Returns ImportedTransaction[] ready for the review table.
   */
  async parseEmails(
    userId: string,
    days = 90
  ): Promise<{ transactions: ImportedTransaction[]; scanned: number }> {
    let { accessToken, refreshToken } = await gmailService.getTokens()

    // Fallback: load persisted refresh token from DB
    if (!refreshToken) {
      refreshToken = await gmailService.loadRefreshToken(userId)
    }

    if (!accessToken && !refreshToken) {
      throw new Error('Gmail não conectado. Clique em "Conectar Gmail" primeiro.')
    }

    const { data, error } = await supabase.functions.invoke('parse-gmail', {
      body: {
        provider_token: accessToken,
        provider_refresh_token: refreshToken,
        days,
      },
    })

    if (error) throw error
    if (data?.error) throw new Error(data.error)

    // If Edge Function refreshed the token, persist the new one
    if (data?.token_refreshed && data?.new_access_token && userId) {
      // Edge Function got a new access token — save the refresh token for future use
      await gmailService.saveRefreshToken(userId)
    }

    const transactions: ImportedTransaction[] = (data.transactions ?? []).map((t: any) => ({
      date: t.date,
      amount: t.amount,
      description: t.description,
      type: t.type,
      category: t.category,
      raw: { source: t.source },
    }))

    return { transactions, scanned: data.scanned ?? 0 }
  },
}
