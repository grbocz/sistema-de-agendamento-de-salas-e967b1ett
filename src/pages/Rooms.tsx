import { useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { Edit, Plus, Trash2, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useSettings } from '@/hooks/use-settings'
import { supabase } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RoomFormDialog } from '@/components/rooms/RoomFormDialog'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'
import { Room } from '@/types'

export default function Rooms() {
  const { user, rooms, addRoom, updateRoom, deleteRoom } = useAppStore()
  const { toast } = useToast()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const { showFoodOptions, toggleFoodOptions } = useSettings()

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => a.name.localeCompare(b.name))
  }, [rooms])

  // Auth Guard for Master
  if (user?.role !== 'master') {
    return <Navigate to="/dashboard" replace />
  }

  const handleSave = async (data: Omit<Room, 'id'>, file?: File | null) => {
    let imageUrl = data.imageUrl

    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('room-images')
        .upload(fileName, file)

      if (uploadError) {
        toast({
          title: 'Erro no upload da imagem',
          description: uploadError.message,
          variant: 'destructive',
        })
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('room-images').getPublicUrl(fileName)

      imageUrl = publicUrl
    }

    const finalData = { ...data, imageUrl }

    if (editingRoom) {
      const res = await updateRoom(editingRoom.id, finalData)
      if (res.success) {
        toast({ title: 'Sala atualizada com sucesso.' })
        setDialogOpen(false)
      } else {
        toast({ title: 'Erro', description: res.error, variant: 'destructive' })
      }
    } else {
      const res = await addRoom(finalData)
      if (res.success) {
        toast({ title: 'Sala criada com sucesso.' })
        setDialogOpen(false)
      } else {
        toast({ title: 'Erro', description: res.error, variant: 'destructive' })
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Atenção: Excluir esta sala removerá todas as reservas associadas. Continuar?')) {
      const res = await deleteRoom(id)
      if (res.success) {
        toast({ title: 'Sala removida.' })
      } else {
        toast({ title: 'Erro', description: res.error, variant: 'destructive' })
      }
    }
  }

  const openNew = () => {
    setEditingRoom(null)
    setDialogOpen(true)
  }

  const openEdit = (room: Room) => {
    setEditingRoom(room)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gerenciar Salas</h1>
          <p className="text-muted-foreground mt-1">
            Adicione, edite ou remova as salas do sistema.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 bg-muted/40 px-3 py-2 rounded-lg border border-border/50">
            <Switch
              id="food-toggle"
              checked={showFoodOptions}
              onCheckedChange={toggleFoodOptions}
            />
            <Label htmlFor="food-toggle" className="cursor-pointer text-sm font-medium">
              Opções de Lanche
            </Label>
          </div>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Nova Sala
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-subtle overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Sala</TableHead>
              <TableHead>Capacidade</TableHead>
              <TableHead className="w-[40%]">Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRooms.map((room) => (
              <TableRow key={room.id} className="group transition-colors">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: room.color }}
                    />
                    <span className="whitespace-nowrap">{room.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" /> {room.capacity}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground truncate max-w-[200px]">
                  {room.description}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEdit(room)}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    onClick={() => handleDelete(room.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <RoomFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingRoom}
        onSave={handleSave}
      />
    </div>
  )
}
