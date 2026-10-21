"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Search field that applies on Enter (and when cleared), so each keystroke is
 * not a request. Not a <form>, so it also works inside one (the product editor).
 */
export function SearchBox({
  defaultValue,
  placeholder,
  onSearch,
  className,
}: {
  defaultValue: string;
  placeholder: string;
  onSearch: (value: string) => void;
  className?: string;
}) {
  const t = useTranslations("admin.common");
  const [value, setValue] = useState(defaultValue);

  return (
    <div role="search" className={cn("relative", className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          // Enter would otherwise submit a surrounding form.
          event.preventDefault();
          onSearch(value.trim());
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-lg border border-input bg-card pr-9 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label={t("clearSearch")}
          onClick={() => {
            setValue("");
            onSearch("");
          }}
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}
