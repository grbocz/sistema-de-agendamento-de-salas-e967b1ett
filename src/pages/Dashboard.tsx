import { useState } from 'react'
import { ptBR } from 'date-fns/locale'

import { Calendar } from '@/components/ui/calendar'
import { Card } from '@/components/ui/card'
import { Timeline } from '@/components/dashboard/Timeline'
import { BookingForm } from '@/components/dashboard/BookingForm'
import useAppStore from '@/stores/useAppStore'

export default function Dashboard() {
  const [date, setDate] = useState<Date>(new Date())
  const { reservations, rooms } = useAppStore()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Gerencie e visualize as reservas das salas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="space-y-6 flex flex-col xl:flex-row gap-6">
          <Card className="p-4 shadow-subtle shrink-0 h-fit">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              locale={ptBR}
              className="rounded-md"
            />
          </Card>
          <div className="flex-1 min-w-0">
            <Timeline date={date} reservations={reservations} rooms={rooms} />
          </div>
        </div>

        <div className="sticky top-24">
          <BookingForm selectedDate={date} />
        </div>
      </div>
    </div>
  )
}
