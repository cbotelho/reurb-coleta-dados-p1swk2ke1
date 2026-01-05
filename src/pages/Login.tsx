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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Lock,
  User as UserIcon,
  AlertCircle,
  Mail,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function Login() {
  const { signIn, signUp, resendConfirmation } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  // Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.')
      return
    }

    setError(null)
    setNeedsConfirmation(false)
    setIsLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        console.error('Login error:', error)
        // Check for "Email not confirmed" error
        if (
          error.message === 'Email not confirmed' ||
          error.message.includes('Email not confirmed')
        ) {
          setError(
            'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou solicite um novo link.',
          )
          setNeedsConfirmation(true)
        } else if (error.status === 400) {
          setError(
            'Solicitação inválida. Verifique o formato do email e senha.',
          )
        } else if (error.message === 'Invalid login credentials') {
          setError('Email ou senha incorretos.')
        } else {
          setError(error.message || 'Erro ao tentar conectar.')
        }
      } else {
        // Redirect handled by AuthContext/Router usually, but we can force it
        navigate('/')
      }
    } catch (err) {
      console.error('Unexpected login error:', err)
      setError('Erro inesperado ao tentar conectar. Verifique sua conexão.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !fullName) {
      setError('Por favor, preencha todos os campos.')
      return
    }

    setError(null)
    setNeedsConfirmation(false)
    setIsLoading(true)

    try {
      const { error } = await signUp(email, password, fullName)
      if (error) {
        setError(error.message || 'Erro ao criar conta.')
      } else {
        toast.success(
          'Conta criada! Verifique seu email ou faça login se a confirmação não for necessária.',
        )
        setActiveTab('login')
      }
    } catch (err) {
      setError('Erro ao tentar registrar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      toast.error('Preencha o email para reenviar a confirmação.')
      return
    }
    setIsLoading(true)
    try {
      const { error } = await resendConfirmation(email)
      if (error) {
        toast.error('Erro ao reenviar: ' + error.message)
      } else {
        toast.success('Link de confirmação reenviado! Verifique seu email.')
        setNeedsConfirmation(false)
        setError(null)
      }
    } catch (e) {
      toast.error('Erro inesperado ao reenviar.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-900">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://img.usecurling.com/p/1920/1080?q=urban%20planning%20map&color=blue"
          alt="Background Map"
          className="w-full h-full object-cover object-center opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40" />
      </div>

      <Card className="relative z-10 w-full max-w-md shadow-2xl border-white/10 bg-white/95 backdrop-blur-md mx-4 animate-fade-in-up">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg ring-4 ring-blue-50/50">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            REURB Coleta
          </CardTitle>
          <CardDescription className="text-gray-500">
            Acesso ao Sistema de Regularização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as any)
              setError(null)
              setNeedsConfirmation(false)
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Criar Conta</TabsTrigger>
            </TabsList>

            {error && (
              <div
                className={cn(
                  'mb-4 p-3 rounded-md border flex flex-col gap-2 text-sm animate-fade-in',
                  needsConfirmation
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-red-50 border-red-200 text-red-600',
                )}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>

                {needsConfirmation && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-end mt-1 border-amber-300 hover:bg-amber-100 text-amber-800"
                    onClick={handleResend}
                    disabled={isLoading}
                  >
                    <RefreshCw
                      className={cn(
                        'w-3 h-3 mr-2',
                        isLoading && 'animate-spin',
                      )}
                    />
                    Reenviar Confirmação
                  </Button>
                )}
              </div>
            )}

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Verificando...' : 'Acessar'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Nome Completo</Label>
                  <div className="relative group">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      id="reg-name"
                      placeholder="Seu Nome"
                      autoComplete="name"
                      className="pl-10"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-pass">Senha</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      id="reg-pass"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Mínimo 6 caracteres"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Registrando...' : 'Cadastrar'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} REURB Coleta. Versão 1.0.0
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
