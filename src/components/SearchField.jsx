"use client";

import React, { useEffect, useState } from "react";
import { POKEMON_SPECIES } from "../types/pokemon_species";
import { SET_SYMBOLS } from "../types/set_symbols";

export default function SearchField({
  id = "search-field",
  value: propValue,
  onChange = () => {},
  dataset = "Card Name",
  placeholder = "",
  style = {},
}) {
  const listId = `${id}-list`;

  const options =
    dataset === "Card Name"
      ? POKEMON_SPECIES
      : dataset === "Expansion"
        ? Object.keys(SET_SYMBOLS)
        : [];

  const isControlled = propValue !== undefined;
  const [internalValue, setInternalValue] = useState(
    () => propValue ?? options[0] ?? "",
  );

  useEffect(() => {
    if (isControlled) {
      setInternalValue(propValue ?? "");
      return;
    }

    // If uncontrolled and options change, default to first option if empty
    if ((internalValue === "" || internalValue == null) && options[0]) {
      setInternalValue(options[0]);
    }
  }, [propValue, isControlled, options, internalValue]);

  const value = isControlled ? propValue : internalValue;

  const handleChange = (v) => {
    if (!isControlled) setInternalValue(v);
    onChange(v);
  };

  return (
    <>
      <input
        id={id}
        list={listId}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        // style={{ padding: "8px 12px", height: "32px", ...style }}
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </>
  );
}
