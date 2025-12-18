import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { db } from '@/services/db'
import { User, ActiveSession } from '@/types'

interface CollaborationBadgeProps {
  currentUser: User | null
}

export function CollaborationBadge({ currentUser }: CollaborationBadgeProps) {
  const [sessions, setSessions] = useState<ActiveSession[]>([])

  useEffect(() => {
    if (currentUser) {
      // Register current session
      db.updateUserSession(currentUser, true)

      const interval = setInterval(() => {
        // Keep alive
        db.updateUserSession(currentUser, true)
        // Fetch others
        setSessions(db.getActiveSessions())
      }, 3000)

      return () => {
        clearInterval(interval)
        db.updateUserSession(currentUser, false)
      }
    }
  }, [currentUser])

  if (sessions.length <= 1) return null

  return (
    <div className="flex -space-x-2 overflow-hidden items-center bg-white p-1 rounded-full border shadow-sm">
      {sessions.map((session) => (
        <Tooltip key={session.id}>
          <TooltipTrigger>
            <Avatar className="inline-block h-8 w-8 ring-2 ring-white">
              <AvatarFallback
                style={{ backgroundColor: session.color, color: 'white' }}
                className="text-xs font-bold"
              >
                {session.userName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            <p>{session.userName} (Ativo agora)</p>
          </TooltipContent>
        </Tooltip>
      ))}
      <span className="text-xs pl-3 pr-2 text-muted-foreground font-medium">
        {sessions.length} online
      </span>
    </div>
  )
}
