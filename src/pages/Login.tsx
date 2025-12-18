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
import { Lock, User as UserIcon } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return

    setIsLoading(true)
    const success = await login(username, password)
    if (success) {
      navigate('/')
    }
    setIsLoading(false)
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://img.usecurling.com/p/1920/1080?q=family%20blue%20house%20illustration"
          alt="Família em frente a casa"
          className="w-full h-full object-cover"
        />
        {/* Visual Treatment: Dark Overlay and Blur for readability */}
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
        {/* Gradient for extra depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
      </div>

      {/* Login Card Layer */}
      <Card className="relative z-10 w-full max-w-md shadow-2xl border-white/20 bg-white/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/90">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-2 shadow-md">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            REURB Coleta
          </CardTitle>
          <CardDescription className="text-gray-500">
            Acesso restrito a usuários autorizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  placeholder="Seu nome de usuário"
                  className="pl-10 bg-white"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  className="pl-10 bg-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-xs text-gray-500 text-center">
            Problemas com acesso? Contate o administrador.
            <br />
            Versão 1.2.0
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
