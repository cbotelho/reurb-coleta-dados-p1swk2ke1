import { DrawingStyle, MarkerIconType } from '@/types'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MapPin, Circle, Home, Star, AlertTriangle, Flag } from 'lucide-react'

interface MarkerCustomizerProps {
  style: DrawingStyle
  onChange: (style: Partial<DrawingStyle>) => void
}

export function MarkerCustomizer({ style, onChange }: MarkerCustomizerProps) {
  const icons: { type: MarkerIconType; icon: any; label: string }[] = [
    { type: 'circle', icon: Circle, label: 'Círculo' },
    { type: 'pin', icon: MapPin, label: 'Pin' },
    { type: 'home', icon: Home, label: 'Casa' },
    { type: 'star', icon: Star, label: 'Estrela' },
    { type: 'alert', icon: AlertTriangle, label: 'Alerta' },
    { type: 'flag', icon: Flag, label: 'Bandeira' },
  ]

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Ícone</Label>
        <div className="grid grid-cols-6 gap-1">
          {icons.map((item) => (
            <Button
              key={item.type}
              variant={style.markerIcon === item.type ? 'default' : 'outline'}
              size="icon"
              className={cn(
                'h-8 w-8',
                style.markerIcon === item.type && 'bg-blue-600',
              )}
              onClick={() => onChange({ markerIcon: item.type })}
              title={item.label}
            >
              <item.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Cor Principal</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={style.fillColor}
            onChange={(e) => onChange({ fillColor: e.target.value })}
            className="h-8 w-full rounded border cursor-pointer"
          />
        </div>
      </div>

      {/* Secondary color is typically stroke for markers in our simplified model */}
      <div className="space-y-2">
        <Label>Cor da Borda</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={style.strokeColor}
            onChange={(e) => onChange({ strokeColor: e.target.value })}
            className="h-8 w-full rounded border cursor-pointer"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <Label>Tamanho</Label>
          <span>{(style.markerSize || 1).toFixed(1)}x</span>
        </div>
        <Slider
          value={[style.markerSize || 1]}
          min={0.5}
          max={3}
          step={0.1}
          onValueChange={(v) => onChange({ markerSize: v[0] })}
        />
      </div>
    </div>
  )
}
