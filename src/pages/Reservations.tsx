import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ReservationsTable } from '@/components/reservations/ReservationsTable'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
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

export default function Reservations() {
  const [reservations, setReservations] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()
  const [isMaster, setIsMaster] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterRoom, setFilterRoom] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const [editingRes, setEditingRes] = useState<any | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Edit form state
  const [editDate, setEditDate] = useState('')
  const [editStartTime, setEditStartTime] = useState('')
  const [editDuration, setEditDuration] = useState('')
  const [editRoomId, setEditRoomId] = useState('')
  const [editPaoDeQueijo, setEditPaoDeQueijo] = useState(false)
  const [editCookie, setEditCookie] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const fetchRooms = async () => {
    const { data } = await supabase.from('rooms').select('*').order('name')
    if (data) setRooms(data)
  }

  const fetchReservations = async () => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, profiles(name)')
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })

    if (error) {
      toast({
        title: 'Erro ao buscar reservas',
        description: error.message,
        variant: 'destructive',
      })
      return
    }

    if (data) {
      const formatted = data.map((d: any) => ({
        id: d.id,
        roomId: d.room_id,
        userId: d.user_id,
        date: d.date,
        startTime: d.start_time,
        duration: d.duration_minutes,
        userName: d.user_name || d.profiles?.name,
        status: d.status,
        pao_de_queijo: d.pao_de_queijo,
        cookie: d.cookie,
      }))
      setReservations(formatted)
    }
  }

  const fetchProfile = async () => {
    if (!user) return
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (data && data.role === 'master') {
      setIsMaster(true)
    }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchRooms(), fetchReservations(), fetchProfile()]).finally(() => {
      setLoading(false)
    })
  }, [user])

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('reservations').delete().eq('id', id)
    if (error) {
      toast({ title: 'Erro ao cancelar', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Reserva cancelada' })
      setReservations((prev) => prev.filter((r) => r.id !== id))
    }
  }

  const handleEditClick = (res: any) => {
    setEditingRes(res)
    setEditDate(res.date)
    setEditStartTime(res.startTime)
    setEditDuration(res.duration?.toString() || '60')
    setEditRoomId(res.roomId)
    setEditPaoDeQueijo(res.pao_de_queijo || false)
    setEditCookie(res.cookie || false)
    setIsDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingRes) return

    if (!editRoomId) {
      toast({
        title: 'Sala obrigatória',
        description: 'Por favor, selecione uma sala.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)

    try {
      // Validate availability for the selected room (excluding current reservation)
      const { data: existingReservations, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .eq('room_id', editRoomId)
        .eq('date', editDate)
        .in('status', ['aprovada', 'pendente'])
        .neq('id', editingRes.id)

      if (fetchError) throw fetchError

      const parseTime = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number)
        return h * 60 + m
      }

      const newStart = parseTime(editStartTime)
      const newEnd = newStart + parseInt(editDuration, 10)

      const hasConflict = existingReservations?.some((res: any) => {
        const exStart = parseTime(res.start_time)
        const exEnd = exStart + res.duration_minutes
        return newStart < exEnd && exStart < newEnd
      })

      if (hasConflict) {
        toast({
          title: 'Horário indisponível',
          description: 'Já existe uma reserva pendente ou aprovada para esta sala neste horário.',
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
          room_id: editRoomId,
          pao_de_queijo: editPaoDeQueijo,
          cookie: editCookie,
        })
        .eq('id', editingRes.id)

      if (error) throw error

      toast({ title: 'Reserva atualizada com sucesso' })
      setIsDialogOpen(false)
      fetchReservations()
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const filteredReservations = reservations.filter((res) => {
    const userName = (res.realUserName || res.userName || '').toLowerCase()
    const matchesSearch = searchTerm === '' || userName.includes(searchTerm.toLowerCase())
    const matchesRoom = filterRoom === 'all' || res.roomId === filterRoom
    const matchesStatus = filterStatus === 'all' || res.status === filterStatus
    return matchesSearch && matchesRoom && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Lista de Reservas</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex-1 relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            placeholder="Buscar por solicitante..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={filterRoom} onValueChange={setFilterRoom}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as salas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as salas</SelectItem>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="aprovada">Aprovada</SelectItem>
              <SelectItem value="reprovada">Reprovada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ReservationsTable
        reservations={filteredReservations}
        rooms={rooms}
        onDelete={handleDelete}
        onEdit={handleEditClick}
        isMaster={isMaster}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Reserva</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Sala</Label>
              <Select value={editRoomId} onValueChange={setEditRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a sala" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Data</Label>
              <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Horário de Início</Label>
              <Input
                type="time"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Duração</Label>
              <Select value={editDuration} onValueChange={setEditDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Duração" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1 hora e 30 minutos</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                  <SelectItem value="180">3 horas</SelectItem>
                  <SelectItem value="240">4 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3 mt-2 border p-3 rounded-md">
              <Label className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">
                Extras
              </Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-pao"
                  checked={editPaoDeQueijo}
                  onCheckedChange={(checked) => setEditPaoDeQueijo(checked === true)}
                />
                <Label htmlFor="edit-pao" className="font-normal cursor-pointer">
                  Pão de Queijo
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-cookie"
                  checked={editCookie}
                  onCheckedChange={(checked) => setEditCookie(checked === true)}
                />
                <Label htmlFor="edit-cookie" className="font-normal cursor-pointer">
                  Cookie
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
