import { useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { resolveImageUrl } from '@/utils/imageUrl'

interface PropertyGalleryProps {
  images?: string[]
  title?: string
}

export function PropertyGallery({ images: rawImages = [], title }: PropertyGalleryProps) {
  const [current, setCurrent] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const images = rawImages.map(resolveImageUrl)

  if (images.length === 0) {
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <Maximize2 className="h-16 w-16 text-gray-300" />
      </div>
    )
  }

  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1))
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1))

  return (
    <>
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
        <img src={images[current]} alt={`${title} - ${current + 1}`} className="w-full h-full object-cover" />
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={prev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={next}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setLightboxOpen(true)}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {current + 1} / {images.length}
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-colors ${i === current ? 'border-primary' : 'border-transparent'}`}
            >
              <img src={img} alt={`${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-2">
          <img src={images[current]} alt={title} className="w-full h-auto max-h-[80vh] object-contain" />
        </DialogContent>
      </Dialog>
    </>
  )
}
