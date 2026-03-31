import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Room } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const roomSchema = z.object({
  name: z.string().min(3, 'Nome muito curto'),
  capacity: z.coerce.number().min(1, 'Capacidade inválida'),
  description: z.string().min(5, 'Descrição muito curta'),
  color: z.string().min(1, 'Selecione uma cor'),
})

type RoomFormValues = z.infer<typeof roomSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Room | null
  onSave: (data: Omit<Room, 'id'>) => void
}

const COLORS = [
  { value: 'hsl(var(--chart-1))', label: 'Laranja' },
  { value: 'hsl(var(--chart-2))', label: 'Ciano' },
  { value: 'hsl(var(--chart-3))', label: 'Azul Escuro' },
  { value: 'hsl(var(--chart-4))', label: 'Amarelo' },
  { value: 'hsl(var(--chart-5))', label: 'Laranja Escuro' },
]

export function RoomFormDialog({ open, onOpenChange, initialData, onSave }: Props) {
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: { name: '', capacity: 10, description: '', color: COLORS[0].value },
  })

  useEffect(() => {
    if (open && initialData) {
      form.reset({
        name: initialData.name,
        capacity: initialData.capacity,
        description: initialData.description,
        color: initialData.color,
      })
    } else if (open) {
      form.reset({ name: '', capacity: 10, description: '', color: COLORS[0].value })
    }
  }, [open, initialData, form])

  const onSubmit = (data: RoomFormValues) => {
    onSave(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Sala' : 'Nova Sala'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Sala</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Sala 01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor Identificadora</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COLORS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: c.value }}
                              />
                              {c.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Possui projetor..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full">
                Salvar Sala
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
