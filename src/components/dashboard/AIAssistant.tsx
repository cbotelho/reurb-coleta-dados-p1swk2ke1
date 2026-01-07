import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Zap, Send, MessageSquare } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

export function AIAssistant() {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (!message.trim()) return
    // Logic to send message would go here
    setMessage('')
  }

  return (
    <Card className="flex flex-col h-[500px] border-none shadow-sm bg-white overflow-hidden">
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
      <CardContent className="flex-1 flex flex-col p-0 bg-slate-50/50">
        <ScrollArea className="flex-1 p-4">
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                Como posso ajudar?
              </h4>
              <p className="text-sm text-gray-500 mt-2 max-w-[240px] mx-auto leading-relaxed">
                Pergunte "Onde está meu projeto?" ou sobre legislação de
                regularização fundiária.
              </p>
            </div>
          </div>
        </ScrollArea>
        <div className="p-4 bg-white border-t">
          <div className="relative">
            <Input
              placeholder="Digite sua dúvida..."
              className="pr-10 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 focus-visible:border-blue-500 rounded-full py-6"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1.5 h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full"
              onClick={handleSend}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
