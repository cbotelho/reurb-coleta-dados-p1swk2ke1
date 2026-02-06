// LoteForm.tsx - VERSÃO COM GPS INTEGRADO
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

// Componente de GPS INTEGRADO ao formulário
function GPSButton({ 
  onCoordsCaptured 
}: { 
  onCoordsCaptured: (lat: string, lng: string) => void 
}) {
  const [loading, setLoading] = useState(false)

  const handleCapture = () => {
    setLoading(true)
    
    if (!navigator.geolocation) {
      alert('❌ Seu navegador não suporta GPS')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6)
        const lng = position.coords.longitude.toFixed(6)
        
        // Chama a função para atualizar os campos do formulário
        onCoordsCaptured(lat, lng)
        
        setLoading(false)
        alert(`✅ Coordenadas capturadas!\n\nLatitude: ${lat}\nLongitude: ${lng}`)
      },
      (error) => {
        const errors = {
          1: '📍 Permissão negada! Vá em Configurações do Site → Localização → Permitir',
          2: '📍 GPS desligado! Ative a localização no dispositivo',
          3: '📍 Tempo esgotado! Tente novamente'
        }
        alert(errors[error.code] || 'Erro ao obter localização')
        setLoading(false)
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000,
        maximumAge: 0 
      }
    )
  }

  return (
    <div style={{
      border: '3px solid #3b82f6',
      borderRadius: '12px',
      padding: '20px',
      margin: '20px 0',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        <div>
          <h3 style={{ color: '#1e40af', margin: 0, fontSize: '18px' }}>
            📍 Captura de Coordenadas
          </h3>
          <p style={{ color: '#6b7280', margin: '5px 0 0', fontSize: '14px' }}>
            Clique no botão para capturar sua localização atual
          </p>
        </div>
        
        <button
          onClick={handleCapture}
          disabled={loading}
          style={{
            padding: '14px 24px',
            background: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%'
          }}
        >
          {loading ? (
            <>
              <span className="spinner" style={{
                width: '16px',
                height: '16px',
                border: '2px solid #fff',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                display: 'inline-block'
              }} />
              Capturando...
            </>
          ) : (
            <>
              <span style={{ fontSize: '20px' }}>🌍</span>
              Capturar Minha Localização
            </>
          )}
        </button>
        
        <div style={{
          display: 'flex',
          gap: '10px',
          fontSize: '13px',
          color: '#4b5563'
        }}>
          <span style={{
            padding: '6px 12px',
            background: '#dbeafe',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            ⚡ Alta precisão
          </span>
          <span style={{
            padding: '6px 12px',
            background: '#f3f4f6',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            📱 Funciona no mobile
          </span>
        </div>
      </div>
    </div>
  )
}

// Formulário principal
export default function LoteForm() {
  const { loteId } = useParams<{ loteId?: string }>()
  const [loteData, setLoteData] = useState({
    name: '',
    area: '',
    address: '',
    description: '',
    latitude: '',
    longitude: '',
    status: 'not_surveyed'
  })

  // Função para atualizar coordenadas capturadas
  const handleCoordsCaptured = (lat: string, lng: string) => {
    setLoteData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }))
  }

  // Estilo CSS para o spinner
  const spinnerStyle = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `

  return (
    <>
      <style>{spinnerStyle}</style>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '30px 20px'
      }}>
        {/* Cabeçalho */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h1 style={{
            color: '#1f2937',
            fontSize: '28px',
            margin: '0 0 10px',
            fontWeight: '700'
          }}>
            {loteId ? `Editar Lote ${loteId.slice(0, 8)}...` : 'Novo Lote'}
          </h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            {loteData.area ? `${loteData.area} m²` : 'Preencha os dados do lote'}
          </p>
        </div>

        {/* Tabs Simulados */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '10px'
        }}>
          <button style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}>
            📋 Dados do Lote
          </button>
          <button 
            style={{
              padding: '12px 24px',
              background: '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'not-allowed',
              fontWeight: '600'
            }}
            disabled
          >
            📝 Vistoria (em breve)
          </button>
        </div>

        {/* Formulário */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            color: '#1f2937',
            fontSize: '20px',
            margin: '0 0 25px',
            fontWeight: '600',
            paddingBottom: '15px',
            borderBottom: '2px solid #f3f4f6'
          }}>
            📋 Dados Gerais do Lote
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '25px',
            marginBottom: '25px'
          }}>
            {/* Nome do Lote */}
            <div>
              <label style={{
                display: 'block',
                color: '#374151',
                fontSize: '14px',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                Nome do Lote *
              </label>
              <input
                type="text"
                value={loteData.name}
                onChange={(e) => setLoteData({ ...loteData, name: e.target.value })}
                placeholder="Ex: Lote 001"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'white'
                }}
              />
            </div>

            {/* Área */}
            <div>
              <label style={{
                display: 'block',
                color: '#374151',
                fontSize: '14px',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                Área (m²) *
              </label>
              <input
                type="text"
                value={loteData.area}
                onChange={(e) => setLoteData({ ...loteData, area: e.target.value })}
                placeholder="Ex: 250,32"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'white'
                }}
              />
            </div>

            {/* Endereço */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{
                display: 'block',
                color: '#374151',
                fontSize: '14px',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                Endereço
              </label>
              <input
                type="text"
                value={loteData.address}
                onChange={(e) => setLoteData({ ...loteData, address: e.target.value })}
                placeholder="Endereço completo do lote"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'white'
                }}
              />
            </div>

            {/* Descrição */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{
                display: 'block',
                color: '#374151',
                fontSize: '14px',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                Descrição
              </label>
              <textarea
                value={loteData.description}
                onChange={(e) => setLoteData({ ...loteData, description: e.target.value })}
                placeholder="Descrição detalhada do lote..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'white',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* SEÇÃO DE COORDENADAS COM BOTÃO INTEGRADO */}
          <div style={{
            margin: '40px 0',
            padding: '25px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '2px solid #e2e8f0'
          }}>
            <h3 style={{
              color: '#1e293b',
              fontSize: '18px',
              margin: '0 0 20px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '22px' }}>📍</span>
              Coordenadas Geográficas
            </h3>
            
            {/* Botão de Captura de GPS */}
            <GPSButton onCoordsCaptured={handleCoordsCaptured} />
            
            {/* Campos Latitude e Longitude */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginTop: '25px'
            }}>
              {/* Latitude */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <label style={{
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Latitude *
                  </label>
                  <span style={{
                    fontSize: '12px',
                    color: loteData.latitude ? '#10b981' : '#ef4444',
                    background: loteData.latitude ? '#d1fae5' : '#fee2e2',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontWeight: '500'
                  }}>
                    {loteData.latitude ? '✓ Preenchida' : 'Obrigatório'}
                  </span>
                </div>
                <input
                  type="text"
                  value={loteData.latitude}
                  onChange={(e) => setLoteData({ ...loteData, latitude: e.target.value })}
                  placeholder="Ex: -0.036161"
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: `2px solid ${loteData.latitude ? '#10b981' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: loteData.latitude ? '#f0fdf4' : 'white',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              {/* Longitude */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <label style={{
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Longitude *
                  </label>
                  <span style={{
                    fontSize: '12px',
                    color: loteData.longitude ? '#10b981' : '#ef4444',
                    background: loteData.longitude ? '#d1fae5' : '#fee2e2',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontWeight: '500'
                  }}>
                    {loteData.longitude ? '✓ Preenchida' : 'Obrigatório'}
                  </span>
                </div>
                <input
                  type="text"
                  value={loteData.longitude}
                  onChange={(e) => setLoteData({ ...loteData, longitude: e.target.value })}
                  placeholder="Ex: -51.130895"
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: `2px solid ${loteData.longitude ? '#10b981' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: loteData.longitude ? '#f0fdf4' : 'white',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
            </div>
            
            {/* Visualização das coordenadas */}
            {loteData.latitude && loteData.longitude && (
              <div style={{
                marginTop: '20px',
                padding: '15px',
                background: '#d1fae5',
                border: '2px solid #10b981',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '20px' }}>✅</span>
                <div>
                  <p style={{ color: '#065f46', margin: 0, fontWeight: '500' }}>
                    Coordenadas capturadas com sucesso!
                  </p>
                  <p style={{ color: '#047857', margin: '5px 0 0', fontSize: '13px', fontFamily: 'monospace' }}>
                    Lat: {loteData.latitude} | Lng: {loteData.longitude}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Botão Salvar */}
          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <button
              onClick={() => {
                if (!loteData.latitude || !loteData.longitude) {
                  alert('⚠️ É necessário capturar as coordenadas do lote!')
                  return
                }
                console.log('Dados do lote:', loteData)
                alert('✅ Dados salvos com sucesso! (visualize no console)')
              }}
              style={{
                padding: '16px 48px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '18px',
                fontWeight: '600',
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
                opacity: (!loteData.latitude || !loteData.longitude) ? 0.7 : 1,
                cursor: (!loteData.latitude || !loteData.longitude) ? 'not-allowed' : 'pointer'
              }}
              disabled={!loteData.latitude || !loteData.longitude}
            >
              💾 Salvar Dados do Lote
            </button>
            
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              marginTop: '15px',
              fontStyle: 'italic'
            }}>
              ⚠️ Modo de demonstração - Os dados são apenas visuais
            </p>
          </div>
        </div> {/* ← ADICIONE ESTA LINHA! */}

        {/* Informações */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '10px'
        }}>
          <p style={{ color: '#92400e', margin: 0, fontWeight: '500' }}>
            💡 <strong>Como usar o GPS:</strong>
          </p>
          <ul style={{ color: '#92400e', margin: '10px 0 0', paddingLeft: '20px' }}>
            <li>1. Clique em <strong>"Capturar Minha Localização"</strong></li>
            <li>2. <strong>Permita o acesso à localização</strong> no popup do navegador</li>
            <li>3. Aguarde alguns segundos enquanto o GPS captura sua posição</li>
            <li>4. As coordenadas serão automaticamente preenchidas nos campos</li>
            <li>5. <strong>Confira se os dados estão corretos</strong> antes de salvar</li>
          </ul>
          <p style={{ color: '#92400e', margin: '15px 0 0', fontSize: '13px' }}>
            📱 <strong>No celular:</strong> Certifique-se de que a localização está ativada nas configurações do dispositivo.
          </p>
        </div>
      </div>
    </>
  )
}