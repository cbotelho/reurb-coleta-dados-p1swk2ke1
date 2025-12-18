import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Settings2, Eye, Sun, List } from 'lucide-react'
import { MarkerConfig } from '@/types'

interface AccessibilityControlsProps {
  highContrast: boolean
  onToggleHighContrast: (enabled: boolean) => void
  showLegend: boolean
  onToggleLegend: (enabled: boolean) => void
  markerConfigs: MarkerConfig[]
}

export function AccessibilityControls({
  highContrast,
  onToggleHighContrast,
  showLegend,
  onToggleLegend,
  markerConfigs,
}: AccessibilityControlsProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          title="Acessibilidade e Visualização"
          aria-label="Opções de Acessibilidade e Visualização"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Eye className="h-4 w-4" /> Visualização
          </h4>

          <div className="flex items-center justify-between">
            <Label htmlFor="high-contrast" className="flex items-center gap-2">
              <Sun className="h-4 w-4" /> Alto Contraste
            </Label>
            <Switch
              id="high-contrast"
              checked={highContrast}
              onCheckedChange={onToggleHighContrast}
              aria-label="Ativar modo de alto contraste"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-legend" className="flex items-center gap-2">
              <List className="h-4 w-4" /> Legenda
            </Label>
            <Switch
              id="show-legend"
              checked={showLegend}
              onCheckedChange={onToggleLegend}
              aria-label="Mostrar legenda do mapa"
            />
          </div>

          {showLegend && (
            <div className="pt-4 border-t space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Legenda Atual
              </span>
              <div className="grid grid-cols-1 gap-2">
                {markerConfigs.map((config) => (
                  <div key={config.id} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-black/10"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-sm">{config.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
