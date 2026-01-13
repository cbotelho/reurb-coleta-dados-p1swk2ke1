import { useRef, useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Eraser, Check } from 'lucide-react'

interface SignaturePadProps {
  open: boolean
  onClose: () => void
  onSave: (dataUrl: string) => void
  title?: string
  description?: string
}

export function SignaturePad({
  open,
  onClose,
  onSave,
  title = 'Assinatura',
  description = 'Assine no quadro abaixo',
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const [isEmpty, setIsEmpty] = useState(true)

  // Ajustar tamanho do canvas
  const resizeCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    // Aumentar a resolução para telas de alta densidade (Retina)
    const dpr = window.devicePixelRatio || 1
    
    // Armazenar o conteúdo atual se existir (para não perder ao redimensionar)
    // Nota: Em um fluxo real de resize, seria complexo redesenhar.
    // Aqui assumimos que o resize acontece no mount ou abertura.
    
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
    }
  }

  useEffect(() => {
    if (open) {
      // Pequeno delay para garantir que o dialog renderizou e o canvas tem dimensões
      setTimeout(resizeCanvas, 100)
    }
  }, [open])

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | any) => {
    isDrawingRef.current = true
    setIsEmpty(false)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Recalcular rect para garantir precisão caso tenha havido scroll ou resize
    const rect = canvas.getBoundingClientRect()
    
    // Suporte a mouse e touch
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY
    
    // Coordenadas relativas ao canvas visual
    const x = clientX - rect.left
    const y = clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    // Pequeno ponto para cliques simples
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | any) => {
    if (!isDrawingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY

    const x = clientX - rect.left
    const y = clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    isDrawingRef.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.closePath()
    }
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height) // Limpa em escala de renderização?
    // Use resetTransform para garantir limpeza total se houver scale, 
    // mas aqui o clearRect funciona nas coordenadas do canvas raw. 
    // Como usamos scale(), o clearRect pode precisar de ajuste ou usar width/height.
    // A maneira mais segura:
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
    setIsEmpty(true)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Criar um canvas temporário com fundo branco para salvar como JPEG/PNG sem transparência preta
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tCtx = tempCanvas.getContext('2d')
    if (!tCtx) return
    
    // Fundo branco
    tCtx.fillStyle = '#FFFFFF'
    tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
    
    // Desenhar a assinatura original
    tCtx.drawImage(canvas, 0, 0)
    
    const dataUrl = tempCanvas.toDataURL('image/png')
    onSave(dataUrl)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="border rounded-md bg-white touch-none select-none overflow-hidden h-64 relative cursor-crosshair">
           <canvas
             ref={canvasRef}
             className="w-full h-full block"
             onPointerDown={startDrawing}
             onPointerMove={draw}
             onPointerUp={stopDrawing}
             onPointerLeave={stopDrawing}
             // Eventos touch explícitos para garantir mobile
             onTouchStart={startDrawing}
             onTouchMove={draw}
             onTouchEnd={stopDrawing}
           />
           {isEmpty && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/30 text-xl font-handwriting">
               Assine aqui
             </div>
           )}
        </div>

        <DialogFooter className="flex flex-row justify-between sm:justify-between gap-2">
          <Button variant="outline" onClick={clear} type="button">
            <Eraser className="h-4 w-4 mr-2" />
            Limpar
          </Button>
          <Button onClick={handleSave} disabled={isEmpty} type="button">
            <Check className="h-4 w-4 mr-2" />
            Salvar Assinatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
