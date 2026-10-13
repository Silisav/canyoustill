"use client";

import { useEffect } from "react";

// A note for whoever opens the browser console (AGENTS.md "Easter eggs"): a brain and a
// ReferenceError, a nod to question 1. Printed once per page load.

const BRAIN = [
  "       _.--._ _.--._      ",
  "     .'  ~   V   ~  '.    ",
  "    /  ~   ~ | ~   ~  \\   ",
  "   |  ~  ~   |   ~  ~  |  ",
  "   |   ~   ~ | ~   ~   |  ",
  "    \\  ~  ~  |  ~  ~  /   ",
  "     '._  ~  |  ~  _.'    ",
  "        '--._|_.--'       ",
];
const TEXT: [string, string][] = [
  ["", ""],
  ["", ""],
  ["  > answers", "color:#6F6E7C"],
  ["  Uncaught ReferenceError: answers is not defined", "color:#D6454F"],
  ["", ""],
  ["  They were never in here. They're in your head.", "font-weight:bold"],
  ["  Close the console and read the code.", "font-weight:bold"],
  ["", ""],
];

export function ConsoleNote() {
  useEffect(() => {
    const parts = BRAIN.map((line, i) => `%c${line}%c${TEXT[i][0]}`).join("\n");
    const styles = BRAIN.flatMap((_, i) => ["color:#EB7AA1", TEXT[i][1]]);
    console.log(parts, ...styles);
  }, []);
  return null;
}
