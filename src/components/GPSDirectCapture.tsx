// src/components/GPSDirectCapture.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Loader2, Check, Copy, AlertCircle } from 'lucide-react'

export function GPSDirectCapture() {
  const [state, setState] = useState<{
    loading: boolean
    lat: string
    lng: string
    error: string
    copied: boolean
  }>({
    loading: false,
    lat: '',
    lng: '',
    error: '',
    copied: false
  })

  const captureDirect = () => {
    setState(prev => ({ ...prev, loading: true, error: '' }))
    
    if (!navigator.geolocation) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Seu navegador não suporta GPS. Tente Chrome ou Edge.' 
      }))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6)
        const lng = position.coords.longitude.toFixed(6)
        
        setState({
          loading: false,
          lat,
          lng,
          error: '',
          copied: false
        })
        
        // Auto-copy
        navigator.clipboard.writeText(`${lat}, ${lng}`)
        setTimeout(() => {
          setState(prev => ({ ...prev, copied: true }))
          setTimeout(() => {
            setState(prev => ({ ...prev, copied: false }))
          }, 2000)
        }, 100)
      },
      (err) => {
        const errors: Record<number, string> = {
          1: '❌ PERMISSÃO NEGADA: Vá em Configurações do Site → Permissões → Localização → Permitir',
          2: '❌ GPS DESLIGADO: Ative a localização no seu celular/PC',
          3: '❌ TEMPO ESGOTADO: Tente novamente em área aberta'
        }
        
        setState(prev => ({
          ...prev,
          loading: false,
          error: errors[err.code] || `Erro: ${err.message}`
        }))
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    )
  }

  const copyCoords = () => {
    if (state.lat && state.lng) {
      navigator.clipboard.writeText(`${state.lat}, ${state.lng}`)
      setState(prev => ({ ...prev, copied: true }))
      setTimeout(() => {
        setState(prev => ({ ...prev, copied: false }))
      }, 2000)
    }
  }

  return (
    <div className="space-y-4">
      {/* TESTE RÁPIDO */}
      <div className="p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
        <p className="font-bold text-blue-700 mb-2">⚡ TESTE RÁPIDO DO GPS:</p>
        <Button
          onClick={() => {
            if (navigator.geolocation) {
              console.log('✅ Navegador SUPORTA GPS')
              navigator.geolocation.getCurrentPosition(
                p => console.log('✅ POSIÇÃO:', p.coords),
                e => console.log('❌ ERRO:', e)
              )
            } else {
              console.log('❌ Navegador NÃO suporta GPS')
            }
          }}
          variant="outline"
          size="sm"
        >
          Testar no Console
        </Button>
      </div>

      {/* COMPONENTE PRINCIPAL */}
      <Card className="border-2 border-green-500 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardTitle className="flex items-center gap-3">
            <MapPin className="h-6 w-6" />
            CAPTURADOR DE GPS (OFFLINE)
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-4">
          {/* BOTÃO PRINCIPAL */}
          <Button
            onClick={captureDirect}
            disabled={state.loading}
            className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl"
          >
            {state.loading ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                BUSCANDO SATÉLITES GPS...
              </>
            ) : (
              <>
                <MapPin className="mr-3 h-5 w-5" />
                🌍 CLIQUE AQUI PARA ATIVAR GPS
              </>
            )}
          </Button>

          {/* ERRO */}
          {state.error && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-bold text-red-700">ATENÇÃO:</p>
                  <p className="text-red-600">{state.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* RESULTADO */}
          {(state.lat || state.lng) && !state.error && (
            <div className="space-y-4 p-4 border border-green-300 rounded-lg bg-green-50">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-green-800 text-lg">✅ COORDENADAS CAPTURADAS!</h3>
                <Button
                  onClick={copyCoords}
                  variant="outline"
                  size="sm"
                  className={state.copied ? 'bg-green-100 border-green-400 text-green-700' : ''}
                >
                  {state.copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      COPIADO!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      COPIAR TUDO
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Latitude:</p>
                  <div className="p-3 bg-white border border-green-200 rounded font-mono text-lg text-green-700">
                    {state.lat}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Longitude:</p>
                  <div className="p-3 bg-white border border-green-200 rounded font-mono text-lg text-green-700">
                    {state.lng}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="font-medium text-blue-800 mb-2">📋 COMO USAR NO FORMULÁRIO:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Clique em "COPIAR TUDO" acima</li>
                  <li>Vá para os campos "Latitude" e "Longitude"</li>
                  <li>Cole as coordenadas (Ctrl+V)</li>
                  <li>Salve o formulário normalmente</li>
                </ol>
              </div>
            </div>
          )}

          {/* INFORMAÇÕES */}
          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-medium">ℹ️ ESTE COMPONENTE:</p>
            <ul className="space-y-1">
              <li>✅ Funciona SEM internet</li>
              <li>✅ Funciona SEM login</li>
              <li>✅ Não precisa do Supabase</li>
              <li>✅ Usa apenas o GPS do seu dispositivo</li>
              <li>⚠️ Precisa de permissão do navegador</li>
              <li>📍 Funciona melhor ao ar livre</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}