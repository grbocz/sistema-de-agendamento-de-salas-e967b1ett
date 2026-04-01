import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, LogIn, UserCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

const guestSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>
type GuestForm = z.infer<typeof guestSchema>

export default function Index() {
  const { user, loading, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register: registerAdmin,
    handleSubmit: handleSubmitAdmin,
    formState: { errors: adminErrors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const {
    register: registerGuest,
    handleSubmit: handleSubmitGuest,
    formState: { errors: guestErrors },
  } = useForm<GuestForm>({
    resolver: zodResolver(guestSchema),
    defaultValues: { name: '' },
  })

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard')
    }
  }, [user, loading, navigate])

  const onAdminSubmit = async (data: LoginForm) => {
    setIsSubmitting(true)
    const { error } = await signIn(data.email, data.password)
    setIsSubmitting(false)
    if (error) {
      toast({ title: 'Erro ao acessar', description: error.message, variant: 'destructive' })
    }
  }

  const onGuestSubmit = async (data: GuestForm) => {
    setIsSubmitting(true)

    const email = `guest@ethimos.com`
    const password = `EthimosGuest123!`

    localStorage.setItem('@ethimos:guestName', data.name)

    let { error } = await signIn(email, password)

    if (error) {
      const signupRes = await signUp(email, password, 'Acesso Padrão')
      if (signupRes.error && !signupRes.error.message.includes('already registered')) {
        toast({
          title: 'Erro ao acessar',
          description: signupRes.error.message,
          variant: 'destructive',
        })
      } else {
        const signInRes = await signIn(email, password)
        if (signInRes.error) {
          toast({
            title: 'Erro ao acessar',
            description: signInRes.error.message,
            variant: 'destructive',
          })
        }
      }
    }

    setIsSubmitting(false)
  }

  if (loading) return null

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Card className="w-full max-w-md shadow-elevation border-0 ring-1 ring-border/50">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <CalendarDays className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight leading-tight">
            Reserva de Salas de Reunião - Ethimos Investimentos
          </CardTitle>
          <CardDescription>Selecione seu perfil para acessar o sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="padrao" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="padrao">Acesso Padrão</TabsTrigger>
              <TabsTrigger value="admin">Administrador</TabsTrigger>
            </TabsList>

            <TabsContent value="padrao">
              <form onSubmit={handleSubmitGuest(onGuestSubmit)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Seu Nome</Label>
                  <Input
                    id="name"
                    placeholder="Ex: João Silva"
                    {...registerGuest('name')}
                    className={
                      guestErrors.name ? 'border-destructive focus-visible:ring-destructive' : ''
                    }
                  />
                  {guestErrors.name && (
                    <p className="text-sm text-destructive">{guestErrors.name.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full text-md h-11 mt-6"
                  size="lg"
                  disabled={isSubmitting}
                >
                  <UserCircle className="mr-2 h-5 w-5" /> Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin">
              <form onSubmit={handleSubmitAdmin(onAdminSubmit)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="admin@ethimos.com"
                    {...registerAdmin('email')}
                    className={
                      adminErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''
                    }
                  />
                  {adminErrors.email && (
                    <p className="text-sm text-destructive">{adminErrors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <Link to="/esqueci-senha" className="text-sm text-primary hover:underline">
                      Esqueci minha senha
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    {...registerAdmin('password')}
                    className={
                      adminErrors.password
                        ? 'border-destructive focus-visible:ring-destructive'
                        : ''
                    }
                  />
                  {adminErrors.password && (
                    <p className="text-sm text-destructive">{adminErrors.password.message}</p>
                  )}
                </div>
                <div className="pt-2 flex flex-col gap-4">
                  <Button
                    type="submit"
                    className="w-full text-md h-11"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    <LogIn className="mr-2 h-4 w-4" /> Entrar
                  </Button>
                  <div className="text-center text-sm">
                    <Link to="/cadastro" className="text-primary hover:underline font-medium">
                      Cadastrar novo administrador
                    </Link>
                  </div>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
