import "server-only";
import { cache } from "react";
import { store } from "./store";

export const getSettings = cache(() => store.getSettings());
export const getPublishedPrograms = cache(() => store.listPrograms({ publishedOnly: true }));
