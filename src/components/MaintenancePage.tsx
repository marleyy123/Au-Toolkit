
export function MaintenancePage() {
  return (
    <main className="maintenance-page">
      <div className="maintenance-card">
        <div className="maintenance-icon" aria-hidden="true">
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 8v4m0 4h.01" />
            <path d="M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z" />
          </svg>
        </div>

        <span className="maintenance-label">SYSTEM MAINTENANCE</span>

        <h1>Kami Sedang Melakukan Pemeliharaan</h1>

        <p>
          AU Toolkit sedang menjalani pemeliharaan dan peningkatan
          sistem untuk memberikan layanan yang lebih baik.
        </p>

        <div className="maintenance-notice">
          <span className="maintenance-dot" />
          Layanan sementara tidak tersedia
        </div>

        <p className="maintenance-footer">
          Mohon maaf atas ketidaknyamanannya.
          Silakan kunjungi kembali beberapa saat lagi.
        </p>

        <div className="maintenance-brand">AU TOOLKIT</div>
      </div>

      <style>{`
        .maintenance-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: #f8fafc;
          color: #172033;
          font-family: inherit;
          text-align: center;
        }

        .maintenance-card {
          width: 100%;
          max-width: 480px;
        }

        .maintenance-icon {
          width: 68px;
          height: 68px;
          margin: 0 auto 28px;
          display: grid;
          place-items: center;
          border-radius: 20px;
          background: #eef2ff;
          color: #6366f1;
        }

        .maintenance-label {
          color: #6366f1;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .maintenance-card h1 {
          margin: 16px 0 12px;
          font-size: clamp(26px, 5vw, 34px);
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: -1px;
        }

        .maintenance-card > p {
          color: #64748b;
          font-size: 14px;
          line-height: 1.8;
        }

        .maintenance-notice {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-top: 22px;
          padding: 11px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          background: white;
          color: #475569;
          font-size: 12px;
          font-weight: 600;
        }

        .maintenance-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f59e0b;
        }

        .maintenance-card .maintenance-footer {
          margin-top: 28px;
          font-size: 12px;
        }

        .maintenance-brand {
          margin-top: 48px;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 3px;
        }
      `}</style>
    </main>
  );
}
