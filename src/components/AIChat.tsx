import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, Loader2, X, CheckCircle, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { aiService } from '@/services/ai.service'
import { transactionsService } from '@/services/transactions.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/useAuth'
import { cn, formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

interface Message {
    role: 'user' | 'assistant'
    content: string
    command?: {
        type: 'SIMULATION' | 'ADD_TRANSACTION'
        data: any
    }
}

interface AIChatProps {
    onSimulate?: (simulation: any) => void;
}

export function AIChat({ onSimulate }: AIChatProps) {
    const { user } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Initial greeting — runs once on mount intentionally
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    role: 'assistant',
                    content: 'Olá! Sou o Vault AI. Posso simular cenários futuros ou registrar transações para você via chat. Como posso ajudar?'
                }
            ])
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isLoading])

    const handleSend = async () => {
        if (!input.trim() || !user || isLoading) return

        const userMessage: Message = { role: 'user', content: input }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            // Prepare history for API (last 10 messages to keep context but limit tokens)
            // Strip command data to save tokens
            const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
            history.push({ role: 'user', content: userMessage.content })

            const response = await aiService.chat(user.id, history)

            // Execute simulation command if present
            if (response.command?.type === 'SIMULATION' && onSimulate) {
                onSimulate(response.command.data)
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.content,
                command: response.command
            }])
        } catch (error) {
            console.error('Failed to send message:', error)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Desculpe, tive um problema ao processar sua mensagem. Por favor, tente novamente.'
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleConfirmTransaction = async (data: any) => {
        if (!user) return
        try {
            // Validate category
            const validCategories = [
                'Vendas', 'Fornecedores', 'Fixo', 'Variável', 'Receita',
                'Salários', 'Aluguel', 'Serviços', 'Marketing', 'Impostos', 'Outros'
            ];

            const category = validCategories.includes(data.category) ? data.category : 'Outros';

            if (category !== data.category) {
                console.warn(`[AIChat] Invalid category '${data.category}' replaced with 'Outros'`);
            }

            await transactionsService.createTransaction(user.id, {
                type: (data.type?.toLowerCase() === 'receita' || data.type === 'income') ? 'income' : 'expense',
                amount: Number(data.amount),
                category: category,
                description: data.description,
                date: data.date || new Date().toISOString(),
                // status: 'completed' // Remove validation if extra field causes issues
            })

            toast({ title: 'Transação registrada com sucesso!' })

            // Invalidate queries to update dashboard
            queryClient.invalidateQueries({ queryKey: ['transaction-stats'] })
            queryClient.invalidateQueries({ queryKey: ['transactions'] })

            // Add confirmation message
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `✅ Transação de ${formatCurrency(data.amount)} (${category}) registrada!`
            }])

        } catch (error: any) {
            console.error('[AIChat] Transaction error:', error);
            toast({
                title: 'Erro ao registrar transação',
                description: error.message || 'Verifique os console logs para mais detalhes.',
                variant: 'destructive'
            })
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const renderCommandCard = (command: any) => {
        if (!command) return null

        if (command.type === 'ADD_TRANSACTION') {
            const { data } = command
            return (
                <div className="mt-3 p-4 bg-card rounded-xl border border-border shadow-sm">
                    <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-foreground">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Confirmar Transação
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex justify-between">
                            <span>Descrição:</span>
                            <span className="font-medium text-foreground">{data.description}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Valor:</span>
                            <span className={cn("font-medium", data.type === 'income' ? 'text-success' : 'text-destructive')}>
                                {formatCurrency(data.amount)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Categoria:</span>
                            <span className="font-medium text-foreground">{data.category}</span>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleConfirmTransaction(data)}
                    >
                        Confirmar Registro
                    </Button>
                </div>
            )
        }

        if (command.type === 'SIMULATION') {
            const { data } = command
            return (
                <div className="mt-3 p-4 bg-primary/5 rounded-xl border border-primary/20 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <TrendingUp className="w-24 h-24 text-primary" />
                    </div>
                    <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-primary relative z-10">
                        <Sparkles className="w-4 h-4" />
                        Cenário Simulado
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 relative z-10">
                        {data.description}
                    </p>
                    <div className="space-y-2 text-sm relative z-10">
                        {data.revenueChange !== 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Receita:</span>
                                <span className={cn("font-bold", data.revenueChange > 0 ? "text-success" : "text-destructive")}>
                                    {data.revenueChange > 0 ? '+' : ''}{data.revenueChange}%
                                </span>
                            </div>
                        )}
                        {data.expenseChange !== 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Despesas:</span>
                                <span className={cn("font-bold", data.expenseChange < 0 ? "text-success" : "text-destructive")}>
                                    {data.expenseChange > 0 ? '+' : ''}{data.expenseChange}%
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-primary/10 relative z-10">
                        <p className="text-xs text-muted-foreground">
                            *A projeção no gráfico foi atualizada temporariamente para refletir este cenário.
                        </p>
                    </div>
                </div>
            )
        }

        return null
    }

    return (
        <Card className="h-[600px] flex flex-col w-full border-border/60 shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            Vault Chat
                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary">Beta</span>
                        </CardTitle>
                        <CardDescription>
                            Converse sobre suas finanças com inteligência artificial
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <ScrollArea className="h-full p-4">
                    <div className="flex flex-col gap-4 pb-4">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex gap-3 max-w-[85%]",
                                    m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                    m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}>
                                    {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className={cn(
                                        "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                                        m.role === 'user'
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-muted/50 border border-border/50 text-foreground rounded-tl-none"
                                    )}>
                                        <p className="whitespace-pre-wrap">{m.content}</p>
                                    </div>

                                    {/* Render Rich Cards if command exists */}
                                    {m.role === 'assistant' && m.command && renderCommandCard(m.command)}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3 mr-auto max-w-[85%]">
                                <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div className="bg-muted/50 border border-border/50 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
            </CardContent>

            <CardFooter className="p-4 border-t border-border/40">
                <div className="flex w-full gap-2">
                    <Input
                        placeholder="Pergunte sobre seus gastos, saldo ou diga 'Gastei 50 no almoço'..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        className="flex-1 bg-background/50"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        size="icon"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
