import { useState, useMemo } from 'react'
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
import { useToast } from '@/hooks/use-toast'

export default function PendingReservations() {
  const { user } = useAuth()
  const { rooms, reservations, updateReservation } = useAppStore()
  const { toast } = useToast()

  const [loadingId, setLoadingId] = useState<string | null>(null)

  const pendingReservations = useMemo(
    () => reservations.filter((r) => r.status === 'pendente'),
    [reservations],
  )

  if (user?.role !== 'master') {
    return <Navigate to="/dashboard" replace />
  }

  const handleUpdateStatus = async (id: string, newStatus: 'aprovada' | 'reprovada') => {
    setLoadingId(id)
    const res = await updateReservation(id, { status: newStatus })

    if (res.success) {
      toast({
        title: 'Sucesso',
        description: `Reserva ${newStatus} com sucesso.`,
      })
    } else {
      toast({
        title: 'Erro',
        description: res.error || 'Não foi possível atualizar o status da reserva.',
        variant: 'destructive',
      })
    }
    setLoadingId(null)
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
            Existem {pendingReservations.length} reservas pendentes no momento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingReservations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma reserva pendente de aprovação.
            </div>
          ) : (
            <div className="rounded-md border bg-white shadow-subtle overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
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
                  {pendingReservations.map((res) => (
                    <TableRow key={res.id} className="group transition-colors">
                      <TableCell className="font-medium">{getRoomName(res.roomId)}</TableCell>
                      <TableCell>
                        {new Date(res.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{res.startTime}</TableCell>
                      <TableCell>{res.duration} min</TableCell>
                      <TableCell>{(res as any).realUserName || res.userName}</TableCell>
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
