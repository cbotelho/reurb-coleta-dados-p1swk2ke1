import { supabase } from '@/lib/supabase/client'

export function subscribeProjectEvents(projectId, handlers = {}) {
  const channel = supabase.channel(`project:${projectId}:events`, {
    config: { private: true }
  })

  supabase.realtime.setAuth()

  if (handlers.handleInsert) {
    channel.on('broadcast', { event: 'INSERT' }, handlers.handleInsert)
  }
  if (handlers.handleUpdate) {
    channel.on('broadcast', { event: 'UPDATE' }, handlers.handleUpdate)
  }
  if (handlers.handleDelete) {
    channel.on('broadcast', { event: 'DELETE' }, handlers.handleDelete)
  }

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Realtime conectado ao projeto', projectId)
    }
  })

  return channel
}

export function sendProjectMessage(channel, projectId, data) {
  channel.send({
    type: 'broadcast',
    event: 'message_created',
    payload: { project_id: projectId, ...data }
  })
}
