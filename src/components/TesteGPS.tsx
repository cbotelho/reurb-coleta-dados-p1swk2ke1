// src/components/TesteGPS.tsx
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export function TesteGPS() {
  const { toast } = useToast()

  const handleGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast({ 
            title: '✅ Localização obtida', 
            description: `Lat: ${position.coords.latitude.toFixed(6)}, Lon: ${position.coords.longitude.toFixed(6)}` 
          })
        },
        (error) => {
          toast({ 
            title: '❌ Erro', 
            description: error.message, 
            variant: 'destructive' 
          })
        }
      )
    } else {
      toast({ 
        title: '❌ Navegador não suporta GPS', 
        variant: 'destructive' 
      })
    }
  }

  return (
    <div className="p-8 border-4 border-green-500 bg-green-50 rounded-xl">
      <h2 className="text-2xl font-bold text-green-700 mb-4">TESTE GPS PURA</h2>
      <Button
        onClick={handleGeolocation}
        className="bg-green-600 hover:bg-green-700 text-white py-6 px-8 text-lg"
      >
        🌍 TESTAR GEOLOCALIZAÇÃO
      </Button>
      <p className="mt-4 text-sm text-gray-600">
        Este botão não depende do Supabase. Se aparecer, o problema é no backend.
      </p>
    </div>
  )
}