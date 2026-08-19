"use client";

import { useItemDrawer } from "@/components/item-drawer/useItemDrawer";
import type { ItemWithType } from "@/lib/queries/items";
import Image from "next/image";

interface ImageCardProps {
  item: ItemWithType;
}

export function ImageCard({ item }: ImageCardProps) {
  const { openDrawer } = useItemDrawer();

  const handleClick = () => openDrawer(item.id);

  return (
    <div
      onClick={handleClick}
      className="group relative overflow-hidden rounded-xl border border-muted/50 bg-card/20 cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
    >
      <div className="aspect-video relative bg-muted/20">
        {item.fileUrl ? (
        <Image
          src={item.fileUrl}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm truncate">{item.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
          {item.description || "No description"}
        </p>
      </div>
    </div>
  );
}