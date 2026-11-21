"use client";

import { type Context, createContext } from "react";

/** Whether the nearest ProviderButtonGroup draws its logos alone, with the names hidden from sight. */
export const ProviderButtonLabelsHidden: Context<boolean> = createContext(false);
