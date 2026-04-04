import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { Trash2, Edit2, ArrowUpDown, ArrowUp, ArrowDown, Check } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Reservation, Room } from '@/types'
import { minsToTime, timeToMins } from '@/lib/date-utils'

interface Props {
  reservations: Reservation[]
  rooms: Room[]
  onDelete: (id: string) => void
  onEdit: (reservation: Reservation) => void
  isMaster: boolean
}

type SortKey = 'room' | 'date' | 'time' | 'duration' | 'user' | 'status'

export function ReservationsTable({ reservations, rooms, onDelete, onEdit, isMaster }: Props) {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(
    null,
  )

  const sortedReservations = useMemo(() => {
    let sortable = [...reservations]
    if (sortConfig !== null) {
      sortable.sort((a, b) => {
        let aValue: any
        let bValue: any

        if (sortConfig.key === 'room') {
          aValue = rooms.find((r) => r.id === a.roomId)?.name || ''
          bValue = rooms.find((r) => r.id === b.roomId)?.name || ''
        } else if (sortConfig.key === 'date') {
          aValue = a.date
          bValue = b.date
        } else if (sortConfig.key === 'time') {
          aValue = timeToMins(a.startTime)
          bValue = timeToMins(b.startTime)
        } else if (sortConfig.key === 'duration') {
          aValue = a.duration
          bValue = b.duration
        } else if (sortConfig.key === 'user') {
          aValue = (a as any).realUserName || (a as any).user_name || a.userName || ''
          bValue = (b as any).realUserName || (b as any).user_name || b.userName || ''
        } else if (sortConfig.key === 'status') {
          aValue = a.status
          bValue = b.status
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return sortable
  }, [reservations, rooms, sortConfig])

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
    if (sortConfig.direction === 'asc') return <ArrowUp className="ml-2 h-4 w-4" />
    return <ArrowDown className="ml-2 h-4 w-4" />
  }

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-dashed">
        <p className="text-muted-foreground">Nenhuma reserva encontrada.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-white shadow-subtle overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead
              className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
              onClick={() => requestSort('room')}
            >
              <div className="flex items-center">
                Sala <SortIcon columnKey="room" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
              onClick={() => requestSort('date')}
            >
              <div className="flex items-center">
                Data <SortIcon columnKey="date" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
              onClick={() => requestSort('time')}
            >
              <div className="flex items-center">
                Horário <SortIcon columnKey="time" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
              onClick={() => requestSort('duration')}
            >
              <div className="flex items-center">
                Duração <SortIcon columnKey="duration" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
              onClick={() => requestSort('user')}
            >
              <div className="flex items-center">
                Solicitante <SortIcon columnKey="user" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
              onClick={() => requestSort('status')}
            >
              <div className="flex items-center">
                Status <SortIcon columnKey="status" />
              </div>
            </TableHead>
            <TableHead>Extras</TableHead>
            {isMaster && <TableHead className="text-right">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedReservations.map((res) => {
            const room = rooms.find((r) => r.id === res.roomId)
            const endTime = minsToTime(timeToMins(res.startTime) + res.duration)

            return (
              <TableRow key={res.id} className="group">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: room?.color || '#ccc' }}
                    />
                    {room?.name || 'Sala Desconhecida'}
                  </div>
                </TableCell>
                <TableCell>{format(parseISO(res.date), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  {res.startTime} - {endTime}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {res.duration} min
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold text-primary">
                  {(res as any).realUserName || (res as any).user_name || res.userName}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      res.status === 'aprovada'
                        ? 'default'
                        : res.status === 'reprovada'
                          ? 'destructive'
                          : 'outline'
                    }
                    className={
                      res.status === 'pendente'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100/80'
                        : res.status === 'aprovada'
                          ? 'bg-green-100 text-green-800 border-transparent hover:bg-green-100/80'
                          : ''
                    }
                  >
                    {res.status === 'aprovada'
                      ? 'Aprovada'
                      : res.status === 'reprovada'
                        ? 'Reprovada'
                        : 'Pendente'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="flex flex-col gap-1">
                    {(res as any).pao_de_queijo ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground whitespace-nowrap">
                        <Check className="h-3.5 w-3.5 text-green-600" /> Pão de Queijo
                      </span>
                    ) : null}
                    {(res as any).cookie ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground whitespace-nowrap">
                        <Check className="h-3.5 w-3.5 text-green-600" /> Cookie
                      </span>
                    ) : null}
                    {!(res as any).pao_de_queijo && !(res as any).cookie && (
                      <span className="text-muted-foreground/50">-</span>
                    )}
                  </div>
                </TableCell>
                {isMaster && (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 mr-1"
                      onClick={() => onEdit(res)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja cancelar esta reserva?')) {
                          onDelete(res.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
