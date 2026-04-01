import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { useSearchParams } from 'react-router-dom'

import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

import useAppStore from '@/stores/useAppStore'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { generateTimeOptions } from '@/lib/date-utils'

const bookingSchema = z.object({
  roomId: z.string().min(1, 'Selecione uma sala'),
  userName: z.string().min(2, 'Informe o solicitante'),
  startTime: z.string().min(1, 'Selecione o horário inicial'),
  duration: z.string().min(1, 'Selecione a duração'),
})

type BookingFormValues = z.infer<typeof bookingSchema>

interface BookingFormProps {
  selectedDate: Date
  selectedRoomId?: string
}

export function BookingForm({ selectedDate, selectedRoomId }: BookingFormProps) {
  const { rooms, addReservation } = useAppStore()
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()

  const activeRoomId = selectedRoomId || searchParams.get('roomId') || ''

  const isGenericName =
    user?.name === 'Acesso Padrão' || user?.name === 'Usuário' || user?.name === 'generico'
  const defaultUserName = isGenericName ? '' : user?.name || ''

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      roomId: activeRoomId,
      userName: defaultUserName,
      startTime: '09:00',
      duration: '60',
    },
  })

  useEffect(() => {
    if (defaultUserName && !form.getValues('userName')) {
      form.setValue('userName', defaultUserName)
    }
  }, [defaultUserName, form])

  useEffect(() => {
    if (activeRoomId) {
      form.setValue('roomId', activeRoomId, { shouldValidate: true })
    }
  }, [activeRoomId, form])

  const onSubmit = async (data: BookingFormValues) => {
    if (!user) return

    const resResult = await addReservation({
      roomId: data.roomId,
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: data.startTime,
      duration: parseInt(data.duration, 10),
      userId: user.id,
      userName: data.userName,
      user_name: data.userName,
    } as any)

    if (resResult.success) {
      toast({
        title: 'Reserva confirmada!',
        description: 'Sua sala foi agendada com sucesso.',
        variant: 'default',
      })
      form.reset({ ...data, startTime: '' })
    } else {
      toast({
        title: 'Horário indisponível',
        description: 'Reserva não realizada',
        variant: 'destructive',
      })
    }
  }

  const timeOptions = generateTimeOptions()
  const durationOptions = [
    { value: '30', label: '30 Minutos' },
    { value: '60', label: '1 Hora' },
    { value: '90', label: '1h 30m' },
    { value: '120', label: '2 Horas' },
    { value: '180', label: '3 Horas' },
    { value: '240', label: '4 Horas' },
  ]

  return (
    <Card className="shadow-elevation border-t-4 border-t-primary">
      <CardHeader>
        <CardTitle className="text-xl">Nova Reserva</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="roomId"
                render={({ field }) => {
                  const selectedRoom = rooms.find((r) => r.id === field.value)
                  return (
                    <FormItem>
                      <FormLabel>Sala</FormLabel>
                      <FormControl>
                        <Input
                          value={
                            selectedRoom ? selectedRoom.name : 'Selecione uma sala no carrossel'
                          }
                          readOnly
                          className="bg-muted cursor-not-allowed text-muted-foreground"
                          tabIndex={-1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
              <FormField
                control={form.control}
                name="userName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solicitante</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do solicitante" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {' '}
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Horário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.slice(0, -1).map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Duração" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {durationOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Agendar Sala
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
