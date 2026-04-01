import { useState, useEffect, useMemo } from 'react'
import { ptBR } from 'date-fns/locale'
import { Users } from 'lucide-react'

import { Calendar } from '@/components/ui/calendar'
import { Card } from '@/components/ui/card'
import { Timeline } from '@/components/dashboard/Timeline'
import { BookingForm } from '@/components/dashboard/BookingForm'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import useAppStore from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const [date, setDate] = useState<Date>(new Date())
  const { reservations, rooms } = useAppStore()

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => a.name.localeCompare(b.name))
  }, [rooms])

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(sortedRooms[0]?.id || null)

  useEffect(() => {
    if (!selectedRoomId && sortedRooms.length > 0) {
      setSelectedRoomId(sortedRooms[0].id)
    }
  }, [sortedRooms, selectedRoomId])

  const activeRoom = sortedRooms.find((r) => r.id === selectedRoomId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Gerencie e visualize as reservas das salas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex flex-col gap-6 shrink-0 w-full xl:w-[320px]">
            <Card className="p-4 shadow-subtle h-fit flex justify-center w-full mx-auto">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                locale={ptBR}
                className="rounded-md"
              />
            </Card>

            <div className="w-full max-w-[280px] xl:max-w-full mx-auto px-8 relative">
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider text-center xl:text-left">
                Salas
              </h3>
              <Carousel opts={{ align: 'start' }} className="w-full">
                <CarouselContent className="-ml-3">
                  {sortedRooms.map((room) => (
                    <CarouselItem key={room.id} className="pl-3 basis-1/2">
                      <button
                        onClick={() => setSelectedRoomId(room.id)}
                        className={cn(
                          'relative w-full aspect-square cursor-pointer rounded-xl overflow-hidden border-2 transition-all p-0 group focus:outline-none',
                          selectedRoomId === room.id
                            ? 'border-primary shadow-md ring-2 ring-primary/20'
                            : 'border-transparent hover:border-border',
                        )}
                        aria-label={`Selecionar ${room.name}`}
                      >
                        <img
                          src={room.imageUrl}
                          alt={room.name}
                          className={cn(
                            'object-cover w-full h-full transition-transform duration-500 group-hover:scale-110',
                            selectedRoomId !== room.id && 'opacity-80',
                          )}
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-6 pb-2 px-2 text-white text-xs font-semibold text-center truncate">
                          {room.name}
                        </div>
                      </button>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-6 bg-background shadow-md" />
                <CarouselNext className="-right-6 bg-background shadow-md" />
              </Carousel>

              {activeRoom && (
                <Card className="mt-6 p-4 shadow-sm border-l-4 border-l-primary bg-muted/20">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-lg leading-none text-foreground">
                      {activeRoom.name}
                    </h4>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded-md border shadow-subtle shrink-0">
                      <Users className="w-3.5 h-3.5" /> {activeRoom.capacity} lugares
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {activeRoom.description || 'Nenhuma descrição disponível.'}
                  </p>
                </Card>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <Timeline
              date={date}
              reservations={reservations}
              rooms={rooms}
              selectedRoomId={selectedRoomId}
            />
          </div>
        </div>

        <div className="sticky top-24">
          <BookingForm selectedDate={date} selectedRoomId={selectedRoomId || undefined} />
        </div>
      </div>
    </div>
  )
}
