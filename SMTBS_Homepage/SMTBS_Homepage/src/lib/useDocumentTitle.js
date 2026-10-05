import { useEffect } from "react";

const DEFAULT_TITLE = "SMTBS | Smart Movie Ticket Booking System";

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | SMTBS` : DEFAULT_TITLE;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
}
