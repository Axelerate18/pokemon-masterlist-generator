"use client";

import React from "react";

export default function SearchFieldDropdown({
  value,
  onChange,
  options = ["Card Name", "Expansion"],
}) {
  return (
    <select
      id="field-select"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      //   style={{
      //     padding: "8px 12px",
      //     fontSize: "14px",
      //     lineHeight: 1.5,
      //     height: "32px",
      //     width: "110px",
      //     border: "1px solid #ccc",
      //     borderRadius: "4px",
      //     backgroundColor: "white",
      //     cursor: "pointer",
      //   }}
    >
      {options.map((option) => {
        const optValue = typeof option === "string" ? option : option.value;
        const optLabel =
          typeof option === "string" ? option : option.label || option.value;
        return (
          <option key={optValue} value={optValue}>
            {optLabel}
          </option>
        );
      })}
    </select>
  );
}
