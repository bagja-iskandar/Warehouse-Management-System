"use client";

import React from "react";
import {
  AlertTriangle,
  WifiOff,
  ShieldAlert,
  FileQuestion,
  RefreshCw,
  ServerCrash,
  Inbox,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type ErrorStateType =
  | "network"
  | "forbidden"
  | "not_found"
  | "server_error"
  | "empty"
  | "default";

interface ErrorStateCardProps {
  type?: ErrorStateType;
  title?: string;
  message?: string;
  correlationId?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function ErrorStateCard({
  type = "default",
  title,
  message,
  correlationId,
  onRetry,
  isRetrying = false,
  secondaryAction,
  className = "",
}: ErrorStateCardProps) {
  const getConfig = () => {
    switch (type) {
      case "network":
        return {
          icon: <WifiOff className="h-6 w-6" />,
          badgeColor: "bg-rose-50 border-rose-200 text-rose-600",
          defaultTitle: "Gangguan Koneksi Jaringan",
          defaultMessage:
            "Tidak dapat terhubung ke server WMS Nusantara. Periksa koneksi internet Anda.",
          buttonLabel: "Coba Hubungkan Kembali",
        };
      case "forbidden":
        return {
          icon: <ShieldAlert className="h-6 w-6" />,
          badgeColor: "bg-amber-50 border-amber-200 text-amber-600",
          defaultTitle: "Akses Ditolak (403)",
          defaultMessage:
            "Akun Anda tidak memiliki izin untuk melihat atau mengelola data pada modul ini.",
          buttonLabel: "Muat Ulang",
        };
      case "not_found":
        return {
          icon: <FileQuestion className="h-6 w-6" />,
          badgeColor: "bg-slate-50 border-slate-200 text-slate-600",
          defaultTitle: "Data Tidak Ditemukan (404)",
          defaultMessage:
            "Informasi yang Anda cari tidak ditemukan dalam database atau telah dihapus.",
          buttonLabel: "Muat Ulang Data",
        };
      case "server_error":
        return {
          icon: <ServerCrash className="h-6 w-6" />,
          badgeColor: "bg-rose-50 border-rose-200 text-rose-600",
          defaultTitle: "Kendala Pemrosesan Server (500)",
          defaultMessage:
            "Terjadi kendala pada server saat memproses data. Seluruh data transaksi Anda tetap aman.",
          buttonLabel: "Coba Lagi",
        };
      case "empty":
        return {
          icon: <Inbox className="h-6 w-6" />,
          badgeColor: "bg-slate-50 border-slate-200 text-slate-500",
          defaultTitle: "Belum Ada Data Tersedia",
          defaultMessage:
            "Saat ini belum ada data tercatat untuk filter atau kategori yang dipilih.",
          buttonLabel: "Segarkan",
        };
      default:
        return {
          icon: <AlertTriangle className="h-6 w-6" />,
          badgeColor: "bg-amber-50 border-amber-200 text-amber-600",
          defaultTitle: "Gagal Memuat Informasi",
          defaultMessage:
            "Terjadi kesalahan saat memproses data pada tampilan ini. Silakan coba kembali.",
          buttonLabel: "Coba Lagi",
        };
    }
  };

  const config = getConfig();

  return (
    <div
      className={`w-full p-7 sm:p-9 bg-white border border-slate-200/90 rounded-2xl shadow-sm text-center flex flex-col items-center justify-center space-y-4 ${className}`}
    >
      {/* Icon Badge */}
      <div
        className={`h-13 w-13 rounded-2xl border flex items-center justify-center shadow-xs ${config.badgeColor}`}
      >
        {config.icon}
      </div>

      {/* Text Details */}
      <div className="space-y-1.5 max-w-md">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          {title || config.defaultTitle}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {message || config.defaultMessage}
        </p>
      </div>

      {/* Correlation ID Tag */}
      {correlationId && (
        <div className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] font-mono text-slate-500">
          Ref ID: <span className="text-slate-700 font-semibold">{correlationId}</span>
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
        {onRetry && (
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold h-9 px-4 rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            <span>{config.buttonLabel}</span>
          </Button>
        )}

        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction.onClick}
            className="border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold h-9 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
            <span>{secondaryAction.label}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
