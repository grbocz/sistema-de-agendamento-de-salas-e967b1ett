import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ReservationsTable } from '@/components/reservations/ReservationsTable'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'

export default function Reservations() {
  const { user, reservations, rooms, deleteReservation } = useAppStore()
  const { toast } = useToast()

  const [filterRoom, setFilterRoom] = useState('all')
  const [filterDate, setFilterDate] = useState('')

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
        isMaster={isMaster}
      />
    </div>
  )
}
