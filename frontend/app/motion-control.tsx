"use client";
import { useEffect } from "react";
export default function MotionControl() {
  useEffect(() => {
    document.documentElement.dataset.motion = "on";
  }, []);
  return null;
}
