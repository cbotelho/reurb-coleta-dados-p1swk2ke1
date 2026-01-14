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
  initialImage?: string
  title?: string
  description?: string
}

export function SignaturePad({
  open,
  onClose,
  onSave,
  initialImage,
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
    // Se o rect for zero, o elemento ainda não está visível/layoutado
    if (rect.width === 0 || rect.height === 0) return

    const dpr = window.devicePixelRatio || 1
    
    // Guardar conteúdo atual se existir
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx && canvas.width > 0) {
        tempCtx.drawImage(canvas, 0, 0);
    }
    
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      
      // Restaurar imagem
      if (initialImage && isEmpty) {
          const img = new Image();
          img.src = initialImage;
          img.onload = () => {
             ctx.drawImage(img, 0, 0, rect.width, rect.height); // Ajustar para caber
             setIsEmpty(false);
          }
      } else if (!isEmpty) {
          // Se já desenhou, tentar restaurar do temp (complexo devido ao resize, melhor limpar ou manter via state externo)
          // Simplificação: Se redimensionar, limpamos para evitar distorção, a menos que tenhamos initialImage
      }
    }
  }

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    let fallbackTimer: NodeJS.Timeout | null = null;
    let animationFrame: number | null = null;

    if (open && canvasRef.current) {
      // 1. Tentar redimensionar imediatamente
      setTimeout(resizeCanvas, 50); // Small delay to ensure render

      // 2. Usar ResizeObserver para detectar quando o dialog estabilizar
      resizeObserver = new ResizeObserver(() => {
        // Debounce ou requestAnimationFrame para evitar loops
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(resizeCanvas);
      })
      resizeObserver.observe(canvasRef.current);
      
      // 3. Fallback: Forçar redimensionamento após animação do Dialog (geralmente 300ms)
      fallbackTimer = setTimeout(resizeCanvas, 350)
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect()
      if (fallbackTimer) clearTimeout(fallbackTimer)
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, [open, initialImage])

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Evitar scroll e comportamento padrão
    e.preventDefault();
    e.stopPropagation(); // Importante para evitar que eventos subam
    
    // Capturar ponteiro para garantir que o 'up' dispare mesmo fora do canvas
    e.currentTarget.setPointerCapture(e.pointerId);

    isDrawingRef.current = true
    setIsEmpty(false)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    
    // PointerEvent já normaliza coords, não precisamos de e.touches
    // Mas precisamos considerar scroll da página se não for touch-none/fixed
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x, y) // Ponto inicial
    ctx.stroke()
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isDrawingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    isDrawingRef.current = false
    e.currentTarget.releasePointerCapture(e.pointerId);
    
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
        
        <div className="border rounded-md bg-white touch-none select-none overflow-hidden relative cursor-crosshair">
           <canvas
             ref={canvasRef}
             style={{ 
                width: '100%', 
                height: '280px', // Aumentei um pouco para dar mais espaço
                touchAction: 'none',
             }}
             className="block touch-none"
             onPointerDown={startDrawing}
             onPointerMove={draw}
             onPointerUp={stopDrawing}
             onPointerLeave={stopDrawing}
             onPointerCancel={stopDrawing}
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
