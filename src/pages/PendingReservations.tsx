import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Check, X, ClipboardList } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/hooks/use-auth'
import useAppStore from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Reservation } from '@/types'

export default function PendingReservations() {
  const { user } = useAuth()
  const { rooms, reservations } = useAppStore()
  const { toast } = useToast()

  const [localReservations, setLocalReservations] = useState<Reservation[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    // Keep local state in sync with global store for pending reservations
    setLocalReservations(reservations.filter((r) => r.status === 'pendente'))
  }, [reservations])

  if (user?.role !== 'master') {
    return <Navigate to="/dashboard" replace />
  }

  const handleUpdateStatus = async (id: string, newStatus: 'aprovada' | 'reprovada') => {
    setLoadingId(id)
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      // Remove from local state immediately for snappy UI (optimistic update)
      setLocalReservations((prev) => prev.filter((r) => r.id !== id))

      toast({
        title: 'Sucesso',
        description: `Reserva ${newStatus} com sucesso.`,
      })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status da reserva.',
        variant: 'destructive',
      })
    } finally {
      setLoadingId(null)
    }
  }

  const getRoomName = (roomId: string) => {
    return rooms.find((r) => r.id === roomId)?.name || 'Sala Desconhecida'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-primary" />
            Reservas Pendentes
          </h1>
          <p className="text-muted-foreground mt-1">
            Aprove ou reprove solicitações de reserva de salas.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aguardando Aprovação</CardTitle>
          <CardDescription>
            Existem {localReservations.length} reservas pendentes no momento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {localReservations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma reserva pendente de aprovação.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sala</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localReservations.map((res) => (
                    <TableRow key={res.id}>
                      <TableCell className="font-medium">{getRoomName(res.roomId)}</TableCell>
                      <TableCell>
                        {new Date(res.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{res.startTime}</TableCell>
                      <TableCell>{res.duration} min</TableCell>
                      <TableCell>{res.userName}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                          onClick={() => handleUpdateStatus(res.id, 'aprovada')}
                          disabled={loadingId === res.id}
                        >
                          <Check className="h-4 w-4 mr-1" /> Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                          onClick={() => handleUpdateStatus(res.id, 'reprovada')}
                          disabled={loadingId === res.id}
                        >
                          <X className="h-4 w-4 mr-1" /> Reprovar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
