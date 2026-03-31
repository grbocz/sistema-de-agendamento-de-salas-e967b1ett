DO $$
BEGIN
  -- Atualiza reservas antigas que ficaram com user_name nulo
  UPDATE public.reservations r
  SET user_name = p.name
  FROM public.profiles p
  WHERE r.user_id = p.id AND (r.user_name IS NULL OR r.user_name = '');

  -- Previne que o nome "Acesso Padrão" permaneça nas tabelas, trocando para um valor genérico limpo
  UPDATE public.reservations
  SET user_name = 'Usuário'
  WHERE user_name = 'Acesso Padrão';
  
  UPDATE public.profiles
  SET name = 'Usuário'
  WHERE name = 'Acesso Padrão';
END $$;
