import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ReservationsTable } from '@/components/reservations/ReservationsTable'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Reservation, Room } from '@/types'

export default function Reservations() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [isMaster, setIsMaster] = useState(false)
  const [loading, setLoading] = useState(true)

  const [editingRes, setEditingRes] = useState<Reservation | null>(null)

  // Edit form state
  const [editDate, setEditDate] = useState('')
  const [editStartTime, setEditStartTime] = useState('')
  const [editDuration, setEditDuration] = useState('60')
  const [editPao, setEditPao] = useState(false)
  const [editCookie, setEditCookie] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const fetchData = async () => {
    if (!user) return

    setLoading(true)

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userIsMaster = profile?.role === 'master'
    setIsMaster(userIsMaster)

    const { data: roomsData } = await supabase.from('rooms').select('*')
    if (roomsData) {
      setRooms(
        roomsData.map((r) => ({
          id: r.id,
          name: r.name,
          color: r.color,
          capacity: r.capacity,
          description: r.description,
        })) as Room[],
      )
    }

    let query = supabase
      .from('reservations')
      .select('*, profiles(name)')
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })

    if (!userIsMaster) {
      query = query.eq('user_id', user.id)
    }

    const { data: resData } = await query

    if (resData) {
      setReservations(
        resData.map((r) => ({
          id: r.id,
          roomId: r.room_id,
          userId: r.user_id,
          date: r.date,
          startTime: r.start_time,
          duration: r.duration_minutes,
          userName: r.profiles?.name || r.user_name || 'Desconhecido',
          status: r.status,
          pao_de_queijo: r.pao_de_queijo,
          cookie: r.cookie,
        })) as unknown as Reservation[],
      )
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [user])

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('reservations').delete().eq('id', id)
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar a reserva.',
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Sucesso', description: 'Reserva cancelada.' })
      fetchData()
    }
  }

  const handleEdit = (res: any) => {
    setEditingRes(res)
    setEditDate(res.date)

    const timeParts = res.startTime.split(':')
    setEditStartTime(`${timeParts[0]}:${timeParts[1]}`)

    setEditDuration(res.duration.toString())
    setEditPao(res.pao_de_queijo || false)
    setEditCookie(res.cookie || false)
  }

  const saveEdit = async () => {
    if (!editingRes) return
    setIsSaving(true)

    try {
      const parseTime = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number)
        return h * 60 + m
      }

      const newStart = parseTime(editStartTime)
      const newEnd = newStart + parseInt(editDuration, 10)

      const { data: existingReservations, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .eq('room_id', editingRes.roomId)
        .eq('date', editDate)
        .in('status', ['aprovada', 'pendente'])
        .neq('id', editingRes.id)

      if (fetchError) throw fetchError

      const hasConflict = existingReservations?.some((res: any) => {
        const exStart = parseTime(res.start_time)
        const exEnd = exStart + res.duration_minutes
        return newStart < exEnd && exStart < newEnd
      })

      if (hasConflict) {
        toast({
          title: 'Horário Indisponível',
          description: 'Já existe uma reserva para este horário.',
          variant: 'destructive',
        })
        setIsSaving(false)
        return
      }

      const { error } = await supabase
        .from('reservations')
        .update({
          date: editDate,
          start_time: editStartTime,
          duration_minutes: parseInt(editDuration, 10),
          pao_de_queijo: editPao,
          cookie: editCookie,
        })
        .eq('id', editingRes.id)

      if (error) throw error

      toast({ title: 'Sucesso', description: 'Reserva atualizada com sucesso.' })
      setEditingRes(null)
      fetchData()
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Falha ao atualizar reserva.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Reservas</h1>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <ReservationsTable
          reservations={reservations}
          rooms={rooms}
          onDelete={handleDelete}
          onEdit={handleEdit}
          isMaster={true}
        />
      )}

      <Dialog open={!!editingRes} onOpenChange={(open) => !open && setEditingRes(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Reserva</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Data
              </Label>
              <Input
                id="date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Horário
              </Label>
              <Input
                id="time"
                type="time"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duração
              </Label>
              <Select value={editDuration} onValueChange={setEditDuration}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1h 30m</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                  <SelectItem value="180">3 horas</SelectItem>
                  <SelectItem value="240">4 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-start gap-4 mt-2">
              <Label className="text-right pt-2">Extras</Label>
              <div className="col-span-3 flex flex-col gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-pao"
                    checked={editPao}
                    onCheckedChange={(c) => setEditPao(!!c)}
                  />
                  <Label htmlFor="edit-pao" className="font-normal cursor-pointer">
                    Pão de Queijo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-cookie"
                    checked={editCookie}
                    onCheckedChange={(c) => setEditCookie(!!c)}
                  />
                  <Label htmlFor="edit-cookie" className="font-normal cursor-pointer">
                    Cookie
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRes(null)}>
              Cancelar
            </Button>
            <Button onClick={saveEdit} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
