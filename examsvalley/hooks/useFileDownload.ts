// NEW FILE — no web equivalent
// EXTRACTED FROM: NEW FILE
// CONVERTED TO:   hooks/useFileDownload.ts
// BUCKET:         D_replace
// WEB LIBRARIES REPLACED: browser download → expo-file-system + expo-sharing
// LOGIC CHANGES: Wraps expo-file-system to download a remote file to the device cache
//   and open it with the native viewer (PDF reader, etc.)

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useState } from "react";

export function useFileDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const downloadAndOpen = async (url: string, filename: string) => {
    setIsDownloading(true);
    setProgress(0);
    try {
      const fileUri = FileSystem.cacheDirectory + filename;
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        {},
        (downloadProgress) => {
          const pct = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setProgress(pct);
        }
      );
      const result = await downloadResumable.downloadAsync();
      if (!result) throw new Error("Download failed");
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(result.uri);
      }
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  };

  return { downloadAndOpen, isDownloading, progress };
}
