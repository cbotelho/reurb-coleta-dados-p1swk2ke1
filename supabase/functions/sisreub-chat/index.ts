// SisReub AI Assistant - Gemini Chat Integration
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
  message: string
  userId?: string
  context?: {
    currentProject?: string
    userRole?: string
  }
}

interface ChatResponse {
  response: string
  timestamp: string
}

const GEMINI_API_KEY = 'AIzaSyCdNinn5fDYPQbU5D6cOQVoTP5atgPHWvM'
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

const SYSTEM_CONTEXT = `Você é o SisReub AI Assistant, um assistente especializado em regularização fundiária urbana (REURB) no Brasil.

CONHECIMENTO BASE:
- Lei 13.465/2017: Regula REURB-S (social, gratuita) e REURB-E (específica, onerosa)
- REURB-S: Famílias de baixa renda (até 3 salários mínimos), NIS ativo, vulnerabilidade socioeconômica
- REURB-E: Demais casos que não se enquadram nos critérios sociais
- Sistema: Coleta de dados de lotes/quadras, vistorias, análise jurídica automática

INSTRUÇÕES:
1. Responda SEMPRE em português brasileiro
2. Seja conciso e objetivo (máximo 3 parágrafos)
3. Use linguagem acessível, evite juridiquês excessivo
4. Cite artigos da lei quando relevante
5. Se a pergunta não for sobre REURB/regularização fundiária, redirecione educadamente ao tema
6. Para perguntas sobre projetos/status, sugira consultar o dashboard ou técnico responsável

EXEMPLOS DE PERGUNTAS:
- "O que é REURB-S?"
- "Qual a diferença entre REURB-S e REURB-E?"
- "Como funciona a vistoria?"
- "Quem tem direito à gratuidade?"
- "Onde encontro meu projeto?"
`

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  // Log incoming request
  console.log('Method:', req.method)
  console.log('Headers:', {
    auth: req.headers.get('authorization'),
    contentType: req.headers.get('content-type'),
  })

  // Test GET endpoint
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ 
        message: 'sisreub-chat is running', 
        timestamp: new Date().toISOString() 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  // Handle POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Apenas GET e POST são suportados' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('Parse error:', parseError)
      return new Response(
        JSON.stringify({ error: 'JSON inválido', details: String(parseError) }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { message, userId, context }: ChatRequest = body
    console.log('Received message:', message)

    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Mensagem vazia' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build context
    let contextPrompt = ''
    if (context?.currentProject) {
      contextPrompt += `\nProjeto atual: ${context.currentProject}`
    }
    if (context?.userRole) {
      contextPrompt += `\nPerfil do usuário: ${context.userRole}`
    }

    // Build full prompt
    const fullPrompt = `${SYSTEM_CONTEXT}${contextPrompt}

PERGUNTA DO USUÁRIO:
${message}

RESPOSTA (máximo 3 parágrafos, linguagem acessível):`

    console.log('Calling Gemini API...')

    // Call Gemini API
    const geminiResponse = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: fullPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.8,
          topK: 10
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      })
    })

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini error:', geminiResponse.status, errorText)
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`)
    }

    const geminiData = await geminiResponse.json()
    console.log('Gemini response:', geminiData)
    
    // Extract response
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
      'Desculpe, não consegui processar sua pergunta. Tente reformular.'

    const response: ChatResponse = {
      response: aiResponse.trim(),
      timestamp: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in sisreub-chat:', error)
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar mensagem',
        details: errorMessage
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
