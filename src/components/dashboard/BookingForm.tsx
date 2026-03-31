import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'

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
import { generateTimeOptions } from '@/lib/date-utils'

const bookingSchema = z.object({
  roomId: z.string().min(1, 'Selecione uma sala'),
  startTime: z.string().min(1, 'Selecione o horário inicial'),
  duration: z.string().min(1, 'Selecione a duração'),
})

type BookingFormValues = z.infer<typeof bookingSchema>

interface BookingFormProps {
  selectedDate: Date
}

export function BookingForm({ selectedDate }: BookingFormProps) {
  const { rooms, addReservation, user } = useAppStore()
  const { toast } = useToast()

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { roomId: '', startTime: '09:00', duration: '60' },
  })

  const onSubmit = async (data: BookingFormValues) => {
    if (!user) return

    const resResult = await addReservation({
      roomId: data.roomId,
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: data.startTime,
      duration: parseInt(data.duration, 10),
      userId: user.email,
      userName: user.name,
    })

    if (resResult.success) {
      toast({
        title: 'Reserva confirmada!',
        description: 'Sua sala foi agendada com sucesso.',
        variant: 'default',
      })
      form.reset({ ...data, startTime: '', roomId: '' })
    } else {
      toast({ title: 'Conflito de horário', description: resResult.error, variant: 'destructive' })
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
            <FormField
              control={form.control}
              name="roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sala</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a sala" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name} ({room.capacity} cap.)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
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
