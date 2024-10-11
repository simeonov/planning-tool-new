"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const emojis = ['😊', '🎉', '🚀', '🔥', '👍'];

type EmojiSelectorProps = {
  onEmojiSelect: (emoji: string) => void;
};

export default function EmojiSelector({ onEmojiSelect }: EmojiSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          😊
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="flex p-2">
          {emojis.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              className="w-10 h-10 p-0"
              onClick={() => {
                onEmojiSelect(emoji);
                setIsOpen(false);
              }}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
