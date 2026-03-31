import { useState, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ReservationsTable } from '@/components/reservations/ReservationsTable'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { generateTimeOptions } from '@/lib/date-utils'
import { Reservation } from '@/types'

const editSchema = z.object({
  userName: z.string().min(2, 'Informe o solicitante'),
  date: z.string().min(1, 'Informe a data'),
  startTime: z.string().min(1, 'Selecione o horário inicial'),
  duration: z.string().min(1, 'Selecione a duração'),
  roomId: z.string().min(1, 'Selecione a sala'),
})

type EditFormValues = z.infer<typeof editSchema>

export default function Reservations() {
  const { user, reservations, rooms, deleteReservation } = useAppStore()
  const { toast } = useToast()

  const [filterRoom, setFilterRoom] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [editingRes, setEditingRes] = useState<Reservation | null>(null)

  const isMaster = user?.role === 'master'

  const filteredReservations = useMemo(() => {
    let result = [...reservations]

    if (filterRoom !== 'all') {
      result = result.filter((r) => r.roomId === filterRoom)
    }

    if (filterDate) {
      result = result.filter((r) => r.date === filterDate)
    }

    // Sort by date and time
    return result.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      return a.startTime.localeCompare(b.startTime)
    })
  }, [reservations, filterRoom, filterDate])

  const handleDelete = (id: string) => {
    deleteReservation(id)
    toast({ title: 'Reserva cancelada', description: 'A reserva foi removida com sucesso.' })
  }

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  })

  useEffect(() => {
    if (editingRes) {
      form.reset({
        userName: (editingRes as any).user_name || editingRes.userName || '',
        date: editingRes.date,
        startTime: editingRes.startTime,
        duration: editingRes.duration.toString(),
        roomId: editingRes.roomId,
      })
    }
  }, [editingRes, form])

  const onSaveEdit = async (data: EditFormValues) => {
    if (!editingRes) return

    const { error } = await supabase
      .from('reservations')
      .update({
        date: data.date,
        start_time: data.startTime,
        duration_minutes: parseInt(data.duration, 10),
        user_name: data.userName,
        room_id: data.roomId,
      })
      .eq('id', editingRes.id)

    if (!error) {
      toast({ title: 'Reserva atualizada com sucesso!' })
      setEditingRes(null)
      setTimeout(() => window.location.reload(), 500)
    } else {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Lista de Reservas</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe todos os agendamentos realizados pela equipe.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex-1 space-y-1.5">
          <Label>Filtrar por Sala</Label>
          <Select value={filterRoom} onValueChange={setFilterRoom}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as Salas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Salas</SelectItem>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-1.5">
          <Label>Filtrar por Data</Label>
          <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        </div>
      </div>

      <ReservationsTable
        reservations={filteredReservations}
        rooms={rooms}
        onDelete={handleDelete}
        onEdit={(res) => setEditingRes(res)}
        isMaster={isMaster}
      />

      <Dialog open={!!editingRes} onOpenChange={(open) => !open && setEditingRes(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Reserva</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSaveEdit)} className="space-y-4">
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
                            {room.name}
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
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
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
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full">
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
