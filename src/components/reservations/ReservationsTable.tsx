import { format, parseISO } from 'date-fns'
import { Trash2, Edit2 } from 'lucide-react'

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

export function ReservationsTable({ reservations, rooms, onDelete, onEdit, isMaster }: Props) {
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
            <TableHead>Sala</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Horário</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead>Solicitante</TableHead>
            {isMaster && <TableHead className="text-right">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((res) => {
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
