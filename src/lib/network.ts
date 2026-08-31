import { useEffect, useState } from "react";

type NetworkInfo = {
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (type: string, cb: () => void) => void;
  removeEventListener?: (type: string, cb: () => void) => void;
};

function getConnection(): NetworkInfo | undefined {
  if (typeof navigator === "undefined") return undefined;
  const nav = navigator as Navigator & {
    connection?: NetworkInfo;
    mozConnection?: NetworkInfo;
    webkitConnection?: NetworkInfo;
  };
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
}

function isSlow(conn: NetworkInfo | undefined) {
  if (!conn) return false;
  if (conn.saveData) return true;
  const type = conn.effectiveType ?? "";
  return type === "slow-2g" || type === "2g" || type === "3g";
}

/**
 * True on slow / metered mobile connections (or when the user enabled data
 * saving). Heavy backgrounds (uploaded video, YouTube iframe) are replaced by a
 * lightweight still image in that case, so the page never appears empty.
 */
export function useLowBandwidth() {
  const [low, setLow] = useState(false);

  useEffect(() => {
    const conn = getConnection();
    const update = () => setLow(isSlow(getConnection()));
    update();
    conn?.addEventListener?.("change", update);
    return () => conn?.removeEventListener?.("change", update);
  }, []);

  return low;
}
