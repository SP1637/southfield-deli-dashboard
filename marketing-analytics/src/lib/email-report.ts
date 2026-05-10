interface ReportData {
  userName: string;
  userEmail: string;
  startDate: string;
  endDate: string;
  propertyId?: string;
  kpis: {
    revenue: number;
    users: number;
    purchases: number;
    roas: number;
  };
  dashboardUrl: string;
}

export function buildEmailHtml(d: ReportData): string {
  const fmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
      ? n >= 10_000
        ? `${Math.round(n / 1_000)}K`
        : `${(n / 1_000).toFixed(1)}K`
      : String(n);

  const fmtRevenue = (n: number) =>
    `$${n >= 1_000_000 ? (n / 1_000_000).toFixed(2) + "M" : (n / 1_000).toFixed(1) + "K"}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Marketing Analytics Report</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

<!-- Wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Header -->
  <tr>
    <td style="background:#4f46e5;border-radius:12px 12px 0 0;padding:28px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:10px;margin-bottom:12px;">
              <span style="color:white;font-size:20px;">📊</span>
            </div>
            <h1 style="margin:0;color:white;font-size:22px;font-weight:700;">Marketing Analytics Report</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">
              ${d.startDate} — ${d.endDate}
            </p>
          </td>
          <td align="right" style="vertical-align:top;">
            <p style="margin:0;color:rgba(255,255,255,0.6);font-size:12px;">Hi, ${d.userName.split(" ")[0]}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- KPI Cards -->
  <tr>
    <td style="background:white;padding:28px 32px;">
      <h2 style="margin:0 0 20px;font-size:14px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">
        Key Metrics
      </h2>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="25%" style="padding:0 6px 0 0;">
            <div style="background:#f9fafb;border-radius:10px;padding:16px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Revenue</p>
              <p style="margin:8px 0 0;font-size:22px;font-weight:700;color:#111827;">${fmtRevenue(d.kpis.revenue)}</p>
            </div>
          </td>
          <td width="25%" style="padding:0 6px;">
            <div style="background:#f9fafb;border-radius:10px;padding:16px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">ROAS</p>
              <p style="margin:8px 0 0;font-size:22px;font-weight:700;color:#111827;">${d.kpis.roas.toFixed(1)}x</p>
            </div>
          </td>
          <td width="25%" style="padding:0 6px;">
            <div style="background:#f9fafb;border-radius:10px;padding:16px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Users</p>
              <p style="margin:8px 0 0;font-size:22px;font-weight:700;color:#111827;">${fmt(d.kpis.users)}</p>
            </div>
          </td>
          <td width="25%" style="padding:0 0 0 6px;">
            <div style="background:#f9fafb;border-radius:10px;padding:16px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Purchases</p>
              <p style="margin:8px 0 0;font-size:22px;font-weight:700;color:#111827;">${fmt(d.kpis.purchases)}</p>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Divider -->
  <tr>
    <td style="background:white;padding:0 32px;">
      <div style="height:1px;background:#f3f4f6;"></div>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td style="background:white;padding:24px 32px 28px;border-radius:0 0 12px 12px;">
      <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">
        Open your live dashboard to see full breakdowns, funnels, attribution models, and more.
      </p>
      <a href="${d.dashboardUrl}"
         style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
        Open Dashboard →
      </a>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:20px 32px 0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">
        This report was sent to ${d.userEmail} ·
        <a href="${d.dashboardUrl}/connect" style="color:#9ca3af;">Manage data sources</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
