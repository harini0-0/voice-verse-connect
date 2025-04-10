import React from "react";
import { MoreVertical, Type, Volume2, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface MessageOptionsProps {
  onTranslateToText: (language: string) => void;
  onTranslateToSpeech: (language: string) => void;
}

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
];

const MessageOptions = ({ onTranslateToText, onTranslateToSpeech }: MessageOptionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0 hover:bg-gray-100 hover:text-gray-900"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center">
            <Type className="mr-2 h-4 w-4" />
            <span>Translate to Text</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={`text-${lang.code}`}
                onClick={() => onTranslateToText(lang.code)}
              >
                <Globe className="mr-2 h-4 w-4" />
                <span>{lang.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center">
            <Volume2 className="mr-2 h-4 w-4" />
            <span>Translate to Speech</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={`speech-${lang.code}`}
                onClick={() => onTranslateToSpeech(lang.code)}
              >
                <Globe className="mr-2 h-4 w-4" />
                <span>{lang.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MessageOptions;