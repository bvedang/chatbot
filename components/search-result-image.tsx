/* eslint-disable @next/next/no-img-element */
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useEffect, useState } from 'react';
import { SearchResultImage } from '@/lib/types';

interface SearchResultsImageSectionProps {
  images: SearchResultImage[];
  query?: string;
}

export const SearchResultsImageSection: React.FC<
  SearchResultsImageSectionProps
> = ({ images, query }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  useEffect(() => {
    if (api) {
      api.scrollTo(selectedIndex, true);
    }
  }, [api, selectedIndex]);

  if (!images || images.length === 0) {
    return <div className="text-muted-foreground">No images found</div>;
  }

  let convertedImages: { url: string; description: string }[] = [];
  if (typeof images[0] === 'string') {
    convertedImages = (images as string[]).map((image) => ({
      url: image,
      description: '',
    }));
  } else {
    convertedImages = images as { url: string; description: string }[];
  }

  const displayedImages = showAllImages
    ? convertedImages
    : convertedImages.slice(0, 3);
  const remainingCount = convertedImages.length - 3;

  return (
    <div className="flex flex-wrap gap-2">
      {displayedImages.map((image, index) => (
        <Dialog key={index}>
          <DialogTrigger asChild>
            <div
              className="w-[calc(50%-0.5rem)] md:w-[calc(25%-0.5rem)] aspect-video cursor-pointer relative"
              onClick={() => setSelectedIndex(index)}
            >
              <Card className="flex-1 h-full">
                <CardContent className="p-2 size-full">
                  <img
                    src={image.url}
                    alt={`Image ${index + 1}`}
                    className="size-full object-cover"
                    onError={(e) =>
                      (e.currentTarget.src = '/images/placeholder-image.png')
                    }
                  />
                </CardContent>
              </Card>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Search Images</DialogTitle>
              <DialogDescription className="text-sm">{query}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Carousel
                setApi={setApi}
                className="w-full bg-muted max-h-[60vh]"
              >
                <CarouselContent>
                  {convertedImages.map((img, idx) => (
                    <CarouselItem key={idx}>
                      <div className="p-1 flex items-center justify-center h-full">
                        <img
                          src={img.url}
                          alt={`Image ${idx + 1}`}
                          className="h-auto w-full object-contain max-h-[60vh]"
                          onError={(e) =>
                            (e.currentTarget.src =
                              '/images/placeholder-image.png')
                          }
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="absolute inset-8 flex items-center justify-between p-4">
                  <CarouselPrevious className="size-10 rounded-full shadow focus:outline-none">
                    <span className="sr-only">Previous</span>
                  </CarouselPrevious>
                  <CarouselNext className="size-10 rounded-full shadow focus:outline-none">
                    <span className="sr-only">Next</span>
                  </CarouselNext>
                </div>
              </Carousel>
              <div className="py-2 text-center text-sm text-muted-foreground">
                {current} of {count}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ))}

      {!showAllImages && remainingCount > 0 && (
        <div className="w-[calc(50%-0.5rem)] md:w-[calc(25%-0.5rem)] aspect-video cursor-pointer">
          <Card className="flex-1 h-full">
            <CardContent className="p-2 size-full flex items-center justify-center">
              <Button
                variant="link"
                className="text-muted-foreground"
                onClick={() => setShowAllImages(true)}
              >
                View {remainingCount} more
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
