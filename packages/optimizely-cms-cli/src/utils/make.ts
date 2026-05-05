import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

/** Extracts relative path by removing output directory prefix */
export const getRelevantPath = (fullPath: string, outputDir: string) =>
  fullPath.replace(outputDir, '').slice(1);

/** Creates multiple directories recursively */
export const makeDirs = (dirs: string[], path: string) =>
  Promise.all(dirs.map(it => mkdir(join(path, it), { recursive: true })));

/** Writes multiple files to disk */
export const makeFiles = (files: { path: string; content: string }[]) =>
  Promise.all(files.map(file => writeFile(file.path, file.content, 'utf-8')));
