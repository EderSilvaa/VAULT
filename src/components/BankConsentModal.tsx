// BankConsentModal - LGPD and Open Finance Brasil Consent Dialog
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Shield, Lock, RefreshCw, Trash2, Download, AlertCircle } from 'lucide-react'
import { Badge } from './ui/badge'

interface BankConsentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccept: () => void
  onDecline: () => void
}

export function BankConsentModal({
  open,
  onOpenChange,
  onAccept,
  onDecline,
}: BankConsentModalProps) {
  const [hasReadTerms, setHasReadTerms] = useState(false)
  const [hasAcceptedSync, setHasAcceptedSync] = useState(false)
  const [hasAcceptedStorage, setHasAcceptedStorage] = useState(false)

  const canProceed = hasReadTerms && hasAcceptedSync && hasAcceptedStorage

  const handleAccept = () => {
    if (canProceed) {
      onAccept()
      // Reset checkboxes for next time
      setHasReadTerms(false)
      setHasAcceptedSync(false)
      setHasAcceptedStorage(false)
    }
  }

  const handleDecline = () => {
    onDecline()
    // Reset checkboxes
    setHasReadTerms(false)
    setHasAcceptedSync(false)
    setHasAcceptedStorage(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 bg-gradient-to-br from-card/98 to-card/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Termo de Consentimento</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Open Finance Brasil & Proteção de Dados (LGPD)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Introduction */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">
                  Importante: Leia com atenção
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ao conectar sua conta bancária, você está autorizando o Vault a acessar e processar
                  seus dados financeiros através do <strong>Open Finance Brasil</strong>, em conformidade
                  com a <strong>Lei Geral de Proteção de Dados (LGPD)</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* What we access */}
          <div>
            <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              O que vamos acessar
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Transações bancárias</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Histórico dos últimos 90 dias de receitas e despesas
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Saldo e informações de conta</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nome da conta, tipo, saldo atual e moeda
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Dados do banco conectado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nome da instituição financeira e identificadores de conexão
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What we DO with data */}
          <div>
            <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Como usamos seus dados
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/30">
                <div className="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Sincronização automática a cada 24 horas</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mantemos seus dados financeiros sempre atualizados
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/30">
                <div className="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Análises e projeções financeiras</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Geramos insights sobre seu fluxo de caixa e padrões de gastos
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/30">
                <div className="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Armazenamento seguro e criptografado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Seus dados são protegidos com criptografia de ponta a ponta
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* User rights */}
          <div>
            <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Seus direitos
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Trash2 className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Revogar acesso a qualquer momento</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Você pode desconectar seu banco nas configurações
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Download className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Exportar seus dados</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Solicite uma cópia completa de suas informações
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Trash2 className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Deletar permanentemente</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Exclua toda sua conta e dados associados
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Consent duration */}
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Validade do Consentimento
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  De acordo com as normas do Open Finance Brasil, seu consentimento tem validade de
                  <strong className="text-warning"> 12 meses</strong>. Você será notificado antes da
                  expiração para renovar ou revogar o acesso.
                </p>
              </div>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
              <Checkbox
                id="terms"
                checked={hasReadTerms}
                onCheckedChange={(checked) => setHasReadTerms(checked as boolean)}
                className="mt-1"
              />
              <label
                htmlFor="terms"
                className="text-sm text-foreground leading-relaxed cursor-pointer flex-1"
              >
                Li e compreendi todas as informações acima sobre como meus dados serão coletados,
                armazenados e utilizados pelo Vault.
              </label>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
              <Checkbox
                id="sync"
                checked={hasAcceptedSync}
                onCheckedChange={(checked) => setHasAcceptedSync(checked as boolean)}
                className="mt-1"
              />
              <label
                htmlFor="sync"
                className="text-sm text-foreground leading-relaxed cursor-pointer flex-1"
              >
                Autorizo a <strong>sincronização automática</strong> das minhas transações bancárias
                a cada 24 horas para manter meus dados financeiros atualizados.
              </label>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
              <Checkbox
                id="storage"
                checked={hasAcceptedStorage}
                onCheckedChange={(checked) => setHasAcceptedStorage(checked as boolean)}
                className="mt-1"
              />
              <label
                htmlFor="storage"
                className="text-sm text-foreground leading-relaxed cursor-pointer flex-1"
              >
                Concordo com o <strong>armazenamento seguro</strong> dos meus dados financeiros para
                geração de análises, insights e projeções de fluxo de caixa.
              </label>
            </div>
          </div>

          {/* Footer info */}
          <div className="pt-2">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Este consentimento é fornecido em conformidade com a Lei nº 13.709/2018 (LGPD) e
              Resolução BCB nº 32/2020 (Open Finance Brasil). Seus dados nunca serão compartilhados
              com terceiros sem sua autorização explícita.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDecline}
            className="flex-1"
          >
            Não Aceito
          </Button>
          <Button
            variant="default"
            onClick={handleAccept}
            disabled={!canProceed}
            className="flex-1 bg-gradient-primary"
          >
            {canProceed ? 'Aceito e Concordo' : 'Leia e marque todos os itens'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
