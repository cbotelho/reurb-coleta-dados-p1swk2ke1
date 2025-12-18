import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Lock, User as UserIcon, AlertCircle } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError('Por favor, preencha todos os campos.')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const success = await login(username, password)
      if (success) {
        navigate('/')
      } else {
        setError('Usuário ou senha incorretos.')
      }
    } catch (err) {
      setError('Erro ao tentar conectar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://img.usecurling.com/p/1920/1080?q=family%20in%20front%20of%20blue%20house%20illustration"
          alt="Família em frente a casa azul"
          className="w-full h-full object-cover object-center transition-transform duration-1000 hover:scale-105"
        />
        {/* Visual Treatment: Dark Overlay and Blur for readability */}
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[3px]" />
        {/* Gradient for extra depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
      </div>

      {/* Login Card Layer */}
      <Card className="relative z-10 w-full max-w-md shadow-2xl border-white/20 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 mx-4 animate-fade-in-up">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-2 shadow-lg ring-4 ring-blue-50">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 tracking-tight">
            REURB Coleta
          </CardTitle>
          <CardDescription className="text-gray-500">
            Acesso restrito a usuários autorizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-600 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <div className="relative group">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  id="username"
                  placeholder="Seu nome de usuário"
                  className="pl-10 bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  className="pl-10 bg-gray-50 border-gray-200 focus:border-blue-500 focus:bg-white transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] h-11 font-medium text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </span>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center flex-col gap-4">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            Problemas com acesso? Contate o administrador.
            <br />
            <span className="opacity-70">Versão 0.0.23</span>
          </p>
        </CardFooter>
      </Card>

      {/* Footer info absolute */}
      <div className="absolute bottom-4 left-0 right-0 text-center z-10 pointer-events-none">
        <p className="text-[10px] text-white/40">
          © {new Date().getFullYear()} REURB Coleta Dados. Todos os direitos
          reservados.
        </p>
      </div>
    </div>
  )
}
