import React from "react";
import { BedDouble } from "lucide-react";

export default function Logo({ light = false }) {
  return (
    <div className={`logo ${light ? "logo-light" : ""}`}>
      <span className="logo-mark">
        <BedDouble size={22} strokeWidth={2.4} />
      </span>
      <span>roomly</span>
    </div>
  );
}
