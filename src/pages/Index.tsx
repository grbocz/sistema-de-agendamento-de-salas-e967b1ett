import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarDays, LogIn } from 'lucide-react'

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
import useAppStore from '@/stores/useAppStore'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(3, 'Senha deve ter no mínimo 3 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Index() {
  const { user, login } = useAppStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  const onSubmit = (data: LoginForm) => {
    login(data.email)
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-elevation border-0 ring-1 ring-border/50">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <CalendarDays className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Acesse o Sistema</CardTitle>
          <CardDescription>
            Use <strong className="text-foreground">generico@email.com</strong> ou{' '}
            <strong className="text-foreground">master@email.com</strong>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="nome@exemplo.com"
                {...register('email')}
                className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                className={
                  errors.password ? 'border-destructive focus-visible:ring-destructive' : ''
                }
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full text-md h-11" size="lg">
              <LogIn className="mr-2 h-4 w-4" /> Entrar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
