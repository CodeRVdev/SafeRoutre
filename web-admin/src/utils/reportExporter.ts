import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DashboardCheckinData, CheckedInUser, MissingUser } from '../api/dashboard';

/**
 * Generates and downloads a professional PDF Evacuation Report.
 */
export function exportReportPdf(data: DashboardCheckinData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const alertId = data.alert_id || data.alert?.alert_id || 1;
  const alertTitle = data.alert?.title || `Alert #${alertId}`;
  const broadcastTime = data.alert?.sent_at
    ? new Date(data.alert.sent_at).toLocaleString()
    : new Date().toLocaleString();

  const totalUsers = data.total_expected_users || 0;
  const checkedInCount = data.checked_in_count || 0;
  const missingCount = data.missing_count || 0;
  const completionRate = totalUsers > 0 ? Math.round((checkedInCount / totalUsers) * 100) : 0;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(6, 182, 212); // cyan-500
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('EVACUATION REPORT — POLONOLING NATIONAL HIGH SCHOOL', 14, 15);

  doc.setTextColor(226, 232, 240); // slate-200
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Barangay Polonoling, Tupi, South Cotabato (Zipcode 9505) | SafeRoute GIS', 14, 23);

  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 140, 23);

  // Section 1: Alert Details
  let currentY = 40;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. EMERGENCY ALERT METADATA', 14, currentY);

  currentY += 4;
  doc.setLineWidth(0.5);
  doc.setDrawColor(6, 182, 212);
  doc.line(14, currentY, 196, currentY);

  currentY += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Alert Reference: Alert #${alertId} — ${alertTitle}`, 14, currentY);
  currentY += 5;
  doc.text(`Broadcast Date/Time: ${broadcastTime}`, 14, currentY);
  currentY += 5;
  doc.text(`Incident Location / Zone: Campus Main Complex`, 14, currentY);

  // Section 2: Summary Metrics Table
  currentY += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. EVACUATION ACCOUNTABILITY SUMMARY', 14, currentY);

  currentY += 4;
  doc.setDrawColor(6, 182, 212);
  doc.line(14, currentY, 196, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Metric Category', 'Count / Value', 'Percentage']],
    body: [
      ['Total Campus Population', `${totalUsers} Personnel`, '100%'],
      ['Checked-In Safe / Accounted', `${checkedInCount} Personnel`, `${completionRate}%`],
      ['Unaccounted / Missing Personnel', `${missingCount} Personnel`, `${100 - completionRate}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [6, 182, 212], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  // Section 3: Per-Role Breakdown
  const roles = ['student', 'faculty', 'staff'];
  const roleBreakdownRows = roles.map((role) => {
    const roleTotal =
      data.checked_in_users.filter((u) => u.role === role).length +
      data.missing_users.filter((u) => u.role === role).length;
    const roleCheckedIn = data.checked_in_users.filter((u) => u.role === role).length;
    const roleMissing = data.missing_users.filter((u) => u.role === role).length;
    const roleRate = roleTotal > 0 ? Math.round((roleCheckedIn / roleTotal) * 100) : 0;

    return [
      role.toUpperCase(),
      `${roleTotal}`,
      `${roleCheckedIn}`,
      `${roleMissing}`,
      `${roleRate}%`,
    ];
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. ACCOUNTABILITY BY PERSONNEL ROLE', 14, currentY);

  currentY += 4;
  doc.line(14, currentY, 196, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Role Category', 'Total Expected', 'Checked-In Safe', 'Missing', 'Completion Rate']],
    body: roleBreakdownRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  // Section 4: Detailed Check-in Roster
  currentY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('4. CHECKED-IN PERSONNEL ROSTER', 14, currentY);

  currentY += 4;
  doc.line(14, currentY, 196, currentY);

  const rosterRows = data.checked_in_users.map((u) => [
    u.full_name,
    u.role.toUpperCase(),
    u.department || 'N/A',
    u.zone_name || 'Main Oval',
    new Date(u.checked_in_at).toLocaleTimeString(),
    (u.status || 'safe').toUpperCase(),
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Personnel Name', 'Role', 'Department', 'Assembly Zone', 'Time', 'Status']],
    body: rosterRows.length > 0 ? rosterRows : [['No check-ins recorded yet', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [6, 182, 212], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  // Page Footers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Generated by SafeRoute Campus Safety System — Confidential Official Document', 14, 287);
    doc.text(`Page ${i} of ${pageCount}`, 180, 287);
  }

  doc.save(`Evacuation_Report_Alert_${alertId}.pdf`);
}

/**
 * Downloads a structured CSV Evacuation Report dataset.
 */
export function exportReportCsv(data: DashboardCheckinData) {
  const alertId = data.alert_id || data.alert?.alert_id || 1;
  const headers = ['Name', 'Email', 'Role', 'Department', 'ID Number', 'Zone', 'Check-in Time', 'Status', 'Message'];

  const rows: string[][] = [];

  // Add checked-in users
  data.checked_in_users.forEach((u: CheckedInUser) => {
    rows.push([
      `"${u.full_name}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      `"${u.department || 'N/A'}"`,
      `"${u.id_number || 'N/A'}"`,
      `"${u.zone_name || 'Main Oval'}"`,
      `"${new Date(u.checked_in_at).toLocaleString()}"`,
      `"${u.status || 'safe'}"`,
      `"${(u.message || '').replace(/"/g, '""')}"`,
    ]);
  });

  // Add missing users
  data.missing_users.forEach((u: MissingUser) => {
    rows.push([
      `"${u.full_name}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      `"${u.department || 'N/A'}"`,
      `"${u.id_number || 'N/A'}"`,
      `"Unaccounted"`,
      `"N/A"`,
      `"Missing"`,
      `""`,
    ]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Evacuation_Report_Alert_${alertId}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Triggers browser print dialog.
 */
export function triggerReportPrint() {
  window.print();
}
