// src/services/todoService.ts
import { supabase } from '../lib/supabaseClient'

export const fetchTodos = async () => {
  return await supabase.from('todos').select('*')
}

export const addTodo = async (task: string) => {
  return await supabase.from('todos').insert({ task })
}
