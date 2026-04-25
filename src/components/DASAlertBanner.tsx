import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

interface DASAlertBannerProps {
  userId: string
}

const DISMISS_KEY = (month: number, year: number) => `vault_das_dismissed_${year}_${month}`

export function DASAlertBanner({ userId }: DASAlertBannerProps) {
  const navigate = useNavigate()
  const [dasAmount, setDasAmount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  const now = new Date()
  const today = now.getDate()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  // Show between day 15 and day 20 inclusive
  const daysUntilDay20 = 20 - today
  const shouldShow = today >= 15 && today <= 20

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY(month, year))) {
      setDismissed(true)
      setLoading(false)
      return
    }

    if (!shouldShow) {
      setLoading(false)
      return
    }

    supabase
      .from('tax_calculations')
      .select('das_amount')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle()
      .then(({ data }) => {
        setDasAmount(data ? Number(data.das_amount) : null)
        setLoading(false)
      })
  }, [userId, month, year, shouldShow])

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY(month, year), '1')
    setDismissed(true)
  }

  if (loading || !shouldShow || dismissed) return null

  const urgency = daysUntilDay20 <= 1 ? 'high' : daysUntilDay20 <= 3 ? 'medium' : 'low'
  const label =
    daysUntilDay20 === 0 ? 'vence hoje!' :
    daysUntilDay20 === 1 ? 'vence amanhã' :
    `vence em ${daysUntilDay20} dias`

  const colors = {
    high:   'border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/10',
    medium: 'border-orange-200 bg-orange-50 dark:border-orange-800/40 dark:bg-orange-900/10',
    low:    'border-yellow-200 bg-yellow-50 dark:border-yellow-800/40 dark:bg-yellow-900/10',
  }
  const textColors = {
    high:   'text-red-700 dark:text-red-400',
    medium: 'text-orange-700 dark:text-orange-400',
    low:    'text-yellow-700 dark:text-yellow-400',
  }

  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${colors[urgency]}`}>
      <AlertTriangle className={`w-4 h-4 shrink-0 ${textColors[urgency]}`} />

      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium ${textColors[urgency]}`}>
          DAS {label}
        </span>
        {dasAmount ? (
          <span className="text-sm text-muted-foreground ml-1.5">
            — <strong>{dasAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> até o dia 20
          </span>
        ) : (
          <span className="text-sm text-muted-foreground ml-1.5">
            — calcule o valor antes de pagar
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={() => navigate('/dashboard/taxes')}
        >
          <ExternalLink className="w-3 h-3" />
          Ver impostos
        </Button>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Dispensar até o próximo mês"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
