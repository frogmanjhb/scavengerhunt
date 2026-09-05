import "./loadEnv.js";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const LOCATION_COUNT = 10;

export function isFinished(currentStep: number) {
  return currentStep >= LOCATION_COUNT;
}

export function currentOrderIndex(startIndex: number, currentStep: number) {
  return (startIndex + currentStep) % LOCATION_COUNT;
}
