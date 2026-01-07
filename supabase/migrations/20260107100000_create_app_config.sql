CREATE TABLE IF NOT EXISTS reurb_app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO reurb_app_config (key, value, description)
VALUES ('google_maps_api_key', 'AIzaSyAXzP2IAo_7lrvIILV_KSwjSseRMg6Dqk4', 'Chave de API do Google Maps para uso geral')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
