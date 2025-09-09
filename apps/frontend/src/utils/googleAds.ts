// Google Ads utility functions for managing GPT slots

declare global {
  interface Window {
    googletag: any
  }
}

interface AdSlot {
  id: string
  adUnitPath: string
  size: [number, number]
  element: HTMLElement
}

class GoogleAdsManager {
  private static instance: GoogleAdsManager
  private initialized = false
  private slots: Map<string, AdSlot> = new Map()

  static getInstance(): GoogleAdsManager {
    if (!GoogleAdsManager.instance) {
      GoogleAdsManager.instance = new GoogleAdsManager()
    }
    return GoogleAdsManager.instance
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    return new Promise((resolve) => {
      if (window.googletag) {
        this.setupGPT()
        resolve()
        return
      }

      // Load GPT script
      const script = document.createElement('script')
      script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js'
      script.async = true
      script.onload = () => {
        this.setupGPT()
        resolve()
      }
      document.head.appendChild(script)
    })
  }

  private setupGPT(): void {
    if (!window.googletag) return

    window.googletag.cmd.push(() => {
      // Enable services once
      try {
        window.googletag.pubads().enableSingleRequest()
        window.googletag.pubads().enableAsyncRendering()
        window.googletag.enableServices()
        this.initialized = true
        console.log('Google Ads Manager initialized')
      } catch (error) {
        console.error('Error setting up GPT:', error)
      }
    })
  }

  async createSlot(
    adId: string,
    adUnitPath: string,
    size: [number, number],
    element: HTMLElement
  ): Promise<boolean> {
    await this.initialize()

    if (this.slots.has(adId)) {
      console.log('Slot already exists:', adId)
      return false
    }

    return new Promise((resolve) => {
      window.googletag.cmd.push(() => {
        try {
          // Check if slot already exists in GPT
          const existingSlots = window.googletag.pubads().getSlots()
          const slotExists = existingSlots.some(
            (slot: any) => slot.getSlotElementId() === adId
          )

          if (slotExists) {
            console.log('GPT slot already exists:', adId)
            resolve(false)
            return
          }

          // Create new slot
          const slot = window.googletag.defineSlot(adUnitPath, size, adId)

          if (slot) {
            slot.addService(window.googletag.pubads())

            // Store slot info
            this.slots.set(adId, {
              id: adId,
              adUnitPath,
              size,
              element,
            })

            // Display the ad
            window.googletag.display(adId)

            console.log('Google Ad slot created:', { adId, adUnitPath, size })
            resolve(true)
          } else {
            console.error('Failed to create slot:', adId)
            resolve(false)
          }
        } catch (error) {
          console.error('Error creating slot:', error)
          resolve(false)
        }
      })
    })
  }

  async destroySlot(adId: string): Promise<void> {
    if (!this.slots.has(adId)) return

    return new Promise((resolve) => {
      window.googletag.cmd.push(() => {
        try {
          const slots = window.googletag.pubads().getSlots()
          const slotToDestroy = slots.find(
            (slot: any) => slot.getSlotElementId() === adId
          )

          if (slotToDestroy) {
            window.googletag.destroySlots([slotToDestroy])
            this.slots.delete(adId)
            console.log('Destroyed slot:', adId)
          }
        } catch (error) {
          console.error('Error destroying slot:', error)
        }
        resolve()
      })
    })
  }

  hasSlot(adId: string): boolean {
    return this.slots.has(adId)
  }

  getSlot(adId: string): AdSlot | undefined {
    return this.slots.get(adId)
  }
}

export const googleAdsManager = GoogleAdsManager.getInstance()
