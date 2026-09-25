import type { APIRoute } from "astro";
import { iconPng } from "../lib/seo/icon";

export const GET: APIRoute = () => iconPng(512);
