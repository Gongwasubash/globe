export type EffectMode = 'normal' | 'nvg' | 'thermal' | 'crt'

/**
 * Manages visual effects for the Cesium viewer
 * Uses canvas-based pixel manipulation for effects
 */
export class EffectManager {
  private currentEffect: EffectMode = 'normal'
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private postRenderListener: (scene: any) => void

  constructor(viewer: any) {
    this.canvas = viewer.scene.canvas
    const context = this.canvas.getContext('2d')
    if (!context) {
      throw new Error('Failed to get 2D context from canvas')
    }
    this.ctx = context

    // Create post-render hook
    this.postRenderListener = () => this.applyCurrentEffect()
    viewer.scene.postRender.addEventListener(this.postRenderListener)
  }

  /**
   * Switch to a new effect mode
   */
  setEffect(mode: EffectMode): void {
    if (mode !== this.currentEffect) {
      this.currentEffect = mode
    }
  }

  /**
   * Get current effect mode
   */
  getCurrentEffect(): EffectMode {
    return this.currentEffect
  }

  /**
   * Apply the current effect (called every frame)
   */
  private applyCurrentEffect(): void {
    switch (this.currentEffect) {
      case 'normal':
        // No effect
        break
      case 'nvg':
        this.applyNVG()
        break
      case 'thermal':
        this.applyThermal()
        break
      case 'crt':
        this.applyCRT()
        break
    }
  }

  /**
   * Night Vision effect: Green tint with scanlines and noise
   */
  private applyNVG(): void {
    try {
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114

        // Green phosphor tint
        data[i] = 0 // Red
        data[i + 1] = Math.floor(gray * 0.9) // Green
        data[i + 2] = 0 // Blue
        // data[i + 3] = alpha (unchanged)
      }

      // Add scanlines and noise
      for (let y = 0; y < this.canvas.height; y++) {
        // Add scanlines every 2 pixels
        if (y % 2 === 0) {
          const scanlineIntensity = Math.sin(y * 0.05) * 30
          for (let x = 0; x < this.canvas.width; x++) {
            const idx = (y * this.canvas.width + x) * 4
            data[idx] = Math.max(0, data[idx] - scanlineIntensity)
            data[idx + 1] = Math.max(0, data[idx + 1] - scanlineIntensity)
            data[idx + 2] = Math.max(0, data[idx + 2] - scanlineIntensity)
          }
        }

        // Add noise grain
        if (y % 3 === 0) {
          for (let x = 0; x < this.canvas.width; x++) {
            const idx = (y * this.canvas.width + x) * 4
            const noise = Math.random() * 20
            data[idx + 1] = Math.min(255, data[idx + 1] + noise)
          }
        }
      }

      this.ctx.putImageData(imageData, 0, 0)
    } catch (error) {
      // Silently fail if canvas is blocked by CORS
      console.debug('NVG effect skipped (canvas access restricted)')
    }
  }

  /**
   * Thermal effect: Heat colormap based on luminance
   */
  private applyThermal(): void {
    try {
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        // Get luminance (0-1)
        const luminance =
          (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255

        // Apply thermal colormap
        const rgb = this.getThermalColor(luminance)

        data[i] = rgb[0] // Red
        data[i + 1] = rgb[1] // Green
        data[i + 2] = rgb[2] // Blue
        // data[i + 3] = alpha (unchanged)
      }

      this.ctx.putImageData(imageData, 0, 0)
    } catch (error) {
      console.debug('Thermal effect skipped (canvas access restricted)')
    }
  }

  /**
   * Get thermal color based on temperature value (0-1)
   * Black -> Blue -> Cyan -> Green -> Yellow -> Red -> White
   */
  private getThermalColor(t: number): [number, number, number] {
    // Clamp to 0-1
    t = Math.max(0, Math.min(1, t))

    if (t < 0.25) {
      // Black to Blue
      const ratio = t * 4
      return [0, 0, Math.floor(255 * ratio)]
    } else if (t < 0.5) {
      // Blue to Cyan
      const ratio = (t - 0.25) * 4
      return [0, Math.floor(255 * ratio), 255]
    } else if (t < 0.75) {
      // Cyan to Yellow
      const ratio = (t - 0.5) * 4
      return [Math.floor(255 * ratio), 255, Math.floor(255 * (1 - ratio))]
    } else {
      // Yellow to Red
      const ratio = (t - 0.75) * 4
      return [255, Math.floor(255 * (1 - ratio)), 0]
    }
  }

  /**
   * CRT effect: Scanlines, vignette, and noise
   */
  private applyCRT(): void {
    try {
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
      const data = imageData.data
      const width = this.canvas.width
      const height = this.canvas.height

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4

          // Add scanlines
          const scanline = Math.abs(Math.sin(y * 0.1)) * 0.15
          data[idx] = Math.floor(data[idx] * (1 - scanline))
          data[idx + 1] = Math.floor(data[idx + 1] * (1 - scanline))
          data[idx + 2] = Math.floor(data[idx + 2] * (1 - scanline))

          // Add vignette (darken edges)
          const nx = x / width
          const ny = y / height
          const dist = Math.sqrt((nx - 0.5) ** 2 + (ny - 0.5) ** 2)
          const vignette = 1 - Math.pow(dist * 1.5, 2) * 0.4
          data[idx] = Math.floor(data[idx] * vignette)
          data[idx + 1] = Math.floor(data[idx + 1] * vignette)
          data[idx + 2] = Math.floor(data[idx + 2] * vignette)

          // Add noise
          if (Math.random() > 0.95) {
            const noise = Math.random() * 50
            data[idx] = Math.min(255, data[idx] + noise)
            data[idx + 1] = Math.min(255, data[idx + 1] + noise)
            data[idx + 2] = Math.min(255, data[idx + 2] + noise)
          }
        }
      }

      this.ctx.putImageData(imageData, 0, 0)
    } catch (error) {
      console.debug('CRT effect skipped (canvas access restricted)')
    }
  }

  /**
   * Clean up effect manager
   */
  destroy(viewer: any): void {
    viewer.scene.postRender.removeEventListener(this.postRenderListener)
  }
}
