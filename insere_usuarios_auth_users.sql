DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  user_email TEXT := 'jdasilvatavares@gmail.com'; -- Mude o e-mail aqui
  user_name TEXT := 'Jussara da Silva Tavares Amanajás';       -- Mude o nome aqui
BEGIN
  -- 1. Inserir na auth.users (apenas colunas permitidas)
  INSERT INTO auth.users (
    instance_id, 
    id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    created_at, 
    updated_at, 
    confirmation_token, 
    is_sso_user
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    user_email,
    crypt('Reurb1234@', gen_salt('bf')),
    jsonb_build_object('provider', 'email', 'providers', to_jsonb(ARRAY['email'])),
    jsonb_build_object('full_name', user_name),
    now(), 
    now(), 
    '',
    false
  );

  -- 2. Inserir na auth.identities (Ponte vital para o login)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at,
    provider_id
  )
  VALUES (
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', user_email),
    'email',
    now(), 
    now(), 
    now(),
    new_user_id::text
  );

  RAISE NOTICE 'Usuário criado com sucesso: %', user_email;
END $$;