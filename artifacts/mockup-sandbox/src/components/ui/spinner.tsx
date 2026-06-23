<<<<<<< HEAD
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
=======
import { Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
<<<<<<< HEAD
      {...props}
    />
  )
}

export { Spinner }
=======
      {...(props as any)}
    />
  );
}

export { Spinner };
>>>>>>> b109f47ebaf9b84ca071eddfc4cb8f901854ddcc
