"use client"

import { useEffect, useState } from "react"

type NetworkInformation = EventTarget & {
  effectiveType?: string
  saveData?: boolean
}

export function PwaClient() {
  const [networkState, setNetworkState] = useState<"online" | "offline" | "weak">("online")

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })
    }

    const connection = getConnection()

    function syncNetworkState() {
      if (!navigator.onLine) {
        setNetworkState("offline")
        return
      }

      if (connection?.saveData || connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g") {
        setNetworkState("weak")
        return
      }

      setNetworkState("online")
    }

    syncNetworkState()
    window.addEventListener("online", syncNetworkState)
    window.addEventListener("offline", syncNetworkState)
    connection?.addEventListener("change", syncNetworkState)

    return () => {
      window.removeEventListener("online", syncNetworkState)
      window.removeEventListener("offline", syncNetworkState)
      connection?.removeEventListener("change", syncNetworkState)
    }
  }, [])

  if (networkState === "online") {
    return null
  }

  return (
    <div className="sticky top-0 z-[60] border-b bg-[#26251e] px-4 py-2 text-center text-sm text-white">
      {networkState === "offline" ? "当前网络不可用，已展示可用的本地内容。" : "当前网络较弱，数据可能无法及时更新。"}
    </div>
  )
}

function getConnection() {
  const navigatorWithConnection = navigator as Navigator & {
    connection?: NetworkInformation
    mozConnection?: NetworkInformation
    webkitConnection?: NetworkInformation
  }

  return (
    navigatorWithConnection.connection ??
    navigatorWithConnection.mozConnection ??
    navigatorWithConnection.webkitConnection
  )
}
