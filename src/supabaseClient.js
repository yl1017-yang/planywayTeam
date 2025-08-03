// supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tadibqvctzbrpkisgyhx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZGlicXZjdHpicnBraXNneWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwOTkzOTUsImV4cCI6MjA2OTY3NTM5NX0.jXPoBlC9UN_TMhwtyTKM1bSdnm5k2nIlOWDaLKgXkZY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
