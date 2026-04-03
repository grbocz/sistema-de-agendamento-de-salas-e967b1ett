import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function useSettings() {
  const [showFoodOptions, setShowFoodOptions] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    let isMounted = true

    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'show_food_options')
        .single()

      if (data && isMounted) {
        setShowFoodOptions(data.value === true)
      }
      if (isMounted) setLoading(false)
    }

    fetchSettings()

    // Inscreve-se para escutar mudanças em tempo real na configuração
    const channel = supabase
      .channel('app_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings',
          filter: 'key=eq.show_food_options',
        },
        (payload) => {
          if (isMounted && payload.new) {
            setShowFoodOptions(payload.new.value === true)
          }
        },
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  const toggleFoodOptions = async (val: boolean) => {
    // Atualização otimista para resposta imediata na UI
    setShowFoodOptions(val)

    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'show_food_options', value: val })

    if (error) {
      // Reverte o estado caso ocorra um erro
      setShowFoodOptions(!val)
      toast({
        title: 'Erro ao salvar configuração',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: val ? 'Opções de lanche ativadas' : 'Opções de lanche desativadas',
      })
    }
  }

  return { showFoodOptions, toggleFoodOptions, loading }
}
