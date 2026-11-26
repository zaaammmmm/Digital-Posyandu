"use client";

import React, { useState } from "react";
import { Button } from "../ui/Button";
import { CorrectionRequestModal } from "./CorrectionRequestModal";

export const CorrectionRequestButton: React.FC<{ visitId: string }> = ({ visitId }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>Minta Koreksi</Button>
      <CorrectionRequestModal visitId={visitId} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};
