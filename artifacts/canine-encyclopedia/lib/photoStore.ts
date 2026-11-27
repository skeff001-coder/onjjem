import * as FileSystem from "expo-file-system/legacy";

const DIR = "pack/";

// iOS deletes temporary photo files, so copy each saved dog's photo into the
// app's permanent Documents folder and keep only a relative path.
export async function persistPhoto(uri: string, id: string): Promise<string> {
  try {
    const base = FileSystem.documentDirectory;
    if (!base) return uri;
    await FileSystem.makeDirectoryAsync(base + DIR, { intermediates: true }).catch(() => {});
    const rel = `${DIR}${id}.jpg`;
    await FileSystem.copyAsync({ from: uri, to: base + rel });
    return rel;
  } catch {
    return uri;
  }
}

export function resolvePhoto(uri: string): string {
  if (uri.startsWith(DIR) && FileSystem.documentDirectory) {
    return FileSystem.documentDirectory + uri;
  }
  return uri;
}
