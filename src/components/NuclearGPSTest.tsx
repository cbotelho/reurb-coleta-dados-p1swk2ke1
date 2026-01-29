// src/components/NuclearGPSTest.tsx
'use client'

import { useState } from 'react'

export function NuclearGPSTest() {
  const [status, setStatus] = useState('Clique para testar')
  const [coords, setCoords] = useState({ lat: '', lng: '' })

  const testNuclear = () => {
    setStatus('Testando...')
    
    if (!navigator.geolocation) {
      setStatus('❌ NAVEGADOR NÃO SUPORTA GPS')
      return
    }
    
    setStatus('✅ Navegador OK. Pedindo permissão...')
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6)
        const lng = pos.coords.longitude.toFixed(6)
        setCoords({ lat, lng })
        setStatus(`✅ GPS FUNCIONA! ${lat}, ${lng}`)
        
        alert(`🎉 GPS FUNCIONA!\n\nLatitude: ${lat}\nLongitude: ${lng}`)
      },
      (err) => {
        const errors: Record<number, string> = {
          1: '❌ PERMISSÃO NEGADA: Vá em Configurações → Site → Localização → Permitir',
          2: '❌ GPS DESLIGADO: Ative a localização no dispositivo',
          3: '❌ TEMPO ESGOTADO: Tente novamente'
        }
        setStatus(errors[err.code] || `Erro: ${err.message}`)
        alert(errors[err.code] || `Erro GPS: ${err.message}`)
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    )
  }

  return (
    <div style={{
      border: '5px solid red',
      padding: '30px',
      margin: '30px',
      background: '#fff3cd',
      borderRadius: '10px',
      textAlign: 'center'
    }}>
      <h1 style={{color: '#856404', fontSize: '28px', marginBottom: '20px'}}>
        🚨 TESTE NUCLEAR DO GPS
      </h1>
      
      <button
        onClick={testNuclear}
        style={{
          padding: '20px 40px',
          fontSize: '20px',
          background: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          marginBottom: '20px'
        }}
      >
        🔥 CLIQUE AQUI PARA TESTE NUCLEAR
      </button>
      
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: status.includes('✅') ? '#d4edda' : '#f8d7da',
        border: `2px solid ${status.includes('✅') ? '#28a745' : '#dc3545'}`,
        borderRadius: '5px'
      }}>
        <h3 style={{color: status.includes('✅') ? '#155724' : '#721c24'}}>
          STATUS: {status}
        </h3>
        
        {coords.lat && (
          <div style={{marginTop: '15px'}}>
            <p style={{fontSize: '18px', fontWeight: 'bold'}}>📌 COORDENADAS:</p>
            <p>Latitude: <strong>{coords.lat}</strong></p>
            <p>Longitude: <strong>{coords.lng}</strong></p>
          </div>
        )}
      </div>
      
      <div style={{marginTop: '20px', textAlign: 'left', fontSize: '14px'}}>
        <p><strong>Se este teste NÃO funcionar:</strong></p>
        <ol>
          <li>1. Seu navegador não suporta GPS (use Chrome/Edge)</li>
          <li>2. GPS desligado no dispositivo</li>
          <li>3. Site bloqueado nas configurações de localização</li>
        </ol>
      </div>
    </div>
  )
}