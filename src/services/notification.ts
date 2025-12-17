import { toast } from 'sonner'

class NotificationService {
  private hasPermission = false

  constructor() {
    this.checkPermission()
  }

  private async checkPermission() {
    if (!('Notification' in window)) return

    if (Notification.permission === 'granted') {
      this.hasPermission = true
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      this.hasPermission = permission === 'granted'
    }
  }

  async requestPermission() {
    await this.checkPermission()
    return this.hasPermission
  }

  send(
    title: string,
    body?: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
  ) {
    // Always show in-app toast
    switch (type) {
      case 'success':
        toast.success(title, { description: body })
        break
      case 'error':
        toast.error(title, { description: body })
        break
      case 'warning':
        toast.warning(title, { description: body })
        break
      default:
        toast.info(title, { description: body })
    }

    // Try native notification
    if (this.hasPermission && document.hidden) {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico', // Fallback icon
        })
      } catch (e) {
        console.error('Failed to send native notification', e)
      }
    }
  }
}

export const notificationService = new NotificationService()
