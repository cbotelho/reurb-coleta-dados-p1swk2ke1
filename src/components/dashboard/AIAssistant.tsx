import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Zap, Send, MessageSquare, Loader2, User, Bot } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function AIAssistant() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const getMockResponse = (message: string): string => {
    const lower = message.toLowerCase()
    
    const responses: Record<string, string> = {
      'reurb-s': 'REURB-S é a modalidade social e gratuita de regularização fundiária, destinada a famílias de baixa renda (até 3 salários mínimos) com NIS ativo. É regida pela Lei 13.465/2017 e oferece gratuidade em todos os procedimentos.',
      'reurb-e': 'REURB-E é a modalidade específica e onerosa, aplicada a casos que não se enquadram nos critérios da REURB-S. Envolve custos com análise jurídica e procedimentos cartorários.',
      'vistoria': 'A vistoria técnica é fundamental para avaliar as condições do imóvel, medir a área, verificar benfeitorias e avaliar possíveis passivos ambientais ou conflitos de propriedade.',
      'lei': 'A Lei 13.465/2017 é a legislação que regulamenta a Regularização Fundiária Urbana (REURB) no Brasil, estabelecendo procedimentos para REURB-S e REURB-E.',
      'gratuidade': 'A REURB-S oferece gratuidade completa para famílias de baixa renda, incluindo análise técnica, jurídica e registros cartorários.',
      'lote': 'Um lote é a unidade de terra registrada ou a ser regularizada. Cada lote pertence a uma quadra dentro de um projeto de REURB.',
      'quadra': 'Uma quadra agrupa um conjunto de lotes contíguos dentro de um projeto. É a unidade de organização territorial.',
      'default': 'Bem-vindo ao SisReub AI Assistant! Posso ajudar com dúvidas sobre REURB-S, REURB-E, vistorias, procedimentos e legislação. O que você gostaria de saber?'
    }

    // Procura por keyword mais relevante
    for (const [key, response] of Object.entries(responses)) {
      if (lower.includes(key)) return response
    }

    return responses['default']
  }

  const handleSend = async () => {
    if (!message.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setMessage('')
    setIsLoading(true)

    try {
      // Usar mock response (em produção, usar API real com chave válida)
      const aiText = getMockResponse(userMessage.content)
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 800))

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiText,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error: any) {
      console.error('Error calling AI:', error)
      const detail = error?.message || 'Erro desconhecido'
      toast.error(`Erro: ${detail}`)
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Desculpe, estou com dificuldades técnicas. Tente novamente em alguns instantes.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="flex flex-col h-[500px] max-h-[500px] border-none shadow-sm bg-white overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">SisReub AI Assistant</h3>
            <p className="text-[10px] text-blue-100 font-medium tracking-wide opacity-90">
              POWERED BY GEMINI 3
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 bg-slate-50/50 overflow-hidden">
        <ScrollArea className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  Como posso ajudar?
                </h4>
                <p className="text-sm text-gray-500 mt-2 max-w-[240px] mx-auto leading-relaxed">
                  Pergunte sobre REURB, projetos, vistorias ou legislação de regularização fundiária.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                    <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                      {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        <div className="p-4 bg-white border-t">
          <div className="relative">
            <Input
              placeholder="Digite sua dúvida..."
              className="pr-10 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 focus-visible:border-blue-500 rounded-full py-6"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={isLoading}
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1.5 h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full disabled:opacity-50"
              onClick={handleSend}
              disabled={isLoading || !message.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
