import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lightbulb } from 'lucide-react'

export function TipsCard() {
  return (
    <Card className="bg-blue-600 text-white border-none shadow-md overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-tl-full pointer-events-none" />

      <CardContent className="p-6 relative z-10">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0">
            <Lightbulb className="h-6 w-6 text-yellow-300" />
          </div>
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-lg">Dica REURB-S</h3>
              <p className="text-blue-100 text-sm mt-2 leading-relaxed">
                Projetos de Interesse Social possuem gratuidade nos emolumentos
                cartorários conforme Lei 13.465.
              </p>
            </div>
            <Button
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-0 font-medium"
            >
              Saiba Mais
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
