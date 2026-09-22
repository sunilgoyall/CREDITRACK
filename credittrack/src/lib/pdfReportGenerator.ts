import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Customer, Transaction, Business } from '../types';

/**
 * Format currency for PDF outputs without relying on non-standard Unicode fonts.
 * Uses "Rs." notation for consistent, reliable printing and PDF rendering across all platforms.
 */
function formatPdfCurrency(amount: number): string {
  if (isNaN(amount)) return 'Rs. 0';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  return `${isNegative ? '-' : ''}Rs. ${formatted}`;
}

/**
 * Format date for PDF output
 */
function formatPdfDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format date with time for PDF output
 */
function formatPdfDateTime(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export interface CustomerStatementPdfOptions {
  customer: Customer;
  transactions: Transaction[];
  business: Business | null;
}

export interface TransactionsLedgerPdfOptions {
  transactions: Transaction[];
  business: Business | null;
  filters?: {
    dateRange?: string;
    typeFilter?: string;
    search?: string;
  };
}

/**
 * Generates and downloads a formatted Customer Statement PDF
 */
export function generateCustomerStatementPDF({
  customer,
  transactions,
  business,
}: CustomerStatementPdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  // Header Colors
  const primaryColor: [number, number, number] = [5, 150, 105]; // Emerald 600
  const darkTextColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const mutedTextColor: [number, number, number] = [100, 116, 139]; // Slate 500
  const lightBgColor: [number, number, number] = [248, 250, 252]; // Slate 50

  // 1. Business Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(margin, currentY, pageWidth - margin * 2, 2.5, 'F');
  currentY += 6;

  // Business Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...primaryColor);
  const storeName = business?.business_name || 'CreditTrack Store';
  doc.text(storeName, margin, currentY);

  // Statement Document Title (Right Aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...darkTextColor);
  doc.text('CUSTOMER ACCOUNT STATEMENT', pageWidth - margin, currentY, { align: 'right' });
  currentY += 5;

  // Subtitle / Store metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedTextColor);
  const storeType = business?.business_type || 'Retail & Merchant Khata';
  doc.text(storeType, margin, currentY);

  // Date Generated
  const genDateStr = `Date: ${formatPdfDateTime(new Date().toISOString())}`;
  doc.text(genDateStr, pageWidth - margin, currentY, { align: 'right' });
  currentY += 4;

  // Store contact info
  const storePhone = business?.phone ? `Ph: ${business.phone}` : '';
  const storeEmail = business?.email ? `Email: ${business.email}` : '';
  const storeAddress = business?.address ? `Address: ${business.address}` : '';
  const storeContactLine = [storePhone, storeEmail, storeAddress].filter(Boolean).join(' | ');
  if (storeContactLine) {
    doc.text(storeContactLine, margin, currentY);
    currentY += 4;
  }

  if (business?.upi_id) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(`UPI ID for Payments: ${business.upi_id}`, margin, currentY);
    currentY += 5;
  } else {
    currentY += 2;
  }

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // 2. Customer Information & Summary Cards
  const cardWidth = (pageWidth - margin * 2 - 6) / 2;
  const cardHeight = 32;

  // Customer Details Card
  doc.setFillColor(...lightBgColor);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedTextColor);
  doc.text('STATEMENT ISSUED TO:', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkTextColor);
  doc.text(customer.name, margin + 4, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedTextColor);
  doc.text(`Mobile: ${customer.phone || 'N/A'}`, margin + 4, currentY + 18);

  if (customer.address) {
    const truncatedAddr = customer.address.length > 45 ? `${customer.address.substring(0, 42)}...` : customer.address;
    doc.text(`Address: ${truncatedAddr}`, margin + 4, currentY + 23);
  } else {
    doc.text('Address: On file', margin + 4, currentY + 23);
  }

  const trustScoreText = customer.trustScore !== undefined ? `Trust Rating: ${customer.trustScore}/100 (${customer.trustRating || 'Good'})` : 'Account Verified';
  doc.text(trustScoreText, margin + 4, currentY + 28);

  // Financial Summary Card
  const summaryX = margin + cardWidth + 6;
  doc.setFillColor(...lightBgColor);
  doc.roundedRect(summaryX, currentY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryX, currentY, cardWidth, cardHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedTextColor);
  doc.text('ACCOUNT BALANCE SUMMARY:', summaryX + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Total Credit Given (Udhaar):', summaryX + 4, currentY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72); // Rose
  doc.text(formatPdfCurrency(customer.totalCredit), summaryX + cardWidth - 4, currentY + 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text('Total Payments Received (Jama):', summaryX + 4, currentY + 19);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(formatPdfCurrency(customer.totalPaid), summaryX + cardWidth - 4, currentY + 19, { align: 'right' });

  // Outstanding Balance Box
  const isSettled = customer.outstandingBalance <= 0;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...darkTextColor);
  doc.text('Net Balance Due:', summaryX + 4, currentY + 27);

  doc.setFontSize(11);
  if (isSettled) {
    doc.setTextColor(16, 185, 129);
    doc.text(customer.outstandingBalance < 0 ? `Advance ${formatPdfCurrency(Math.abs(customer.outstandingBalance))}` : 'Rs. 0 (Fully Settled)', summaryX + cardWidth - 4, currentY + 27, { align: 'right' });
  } else {
    doc.setTextColor(225, 29, 72);
    doc.text(formatPdfCurrency(customer.outstandingBalance), summaryX + cardWidth - 4, currentY + 27, { align: 'right' });
  }

  currentY += cardHeight + 8;

  // 3. Transactions Table
  // Sort transactions chronologically ascending for standard statement format
  const sortedTx = [...transactions].sort((a, b) => {
    return new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
  });

  let runningBal = 0;
  const tableRows = sortedTx.map((tx, index) => {
    if (tx.type === 'CREDIT') {
      runningBal += tx.amount;
    } else {
      runningBal -= tx.amount;
    }

    // Build description with item breakdown if any
    let desc = tx.description || (tx.type === 'CREDIT' ? 'Goods purchased on credit' : 'Payment received');
    if (tx.items && tx.items.length > 0) {
      const itemsSummary = tx.items.map((it) => `${it.name} (x${it.quantity})`).join(', ');
      desc = `${desc}\nItems: ${itemsSummary}`;
    }

    return [
      (index + 1).toString(),
      formatPdfDate(tx.transaction_date),
      desc,
      tx.type === 'CREDIT' ? 'Credit (Udhaar)' : 'Payment (Jama)',
      tx.payment_method || '-',
      tx.type === 'CREDIT' ? formatPdfCurrency(tx.amount) : '-',
      tx.type === 'PAYMENT' ? formatPdfCurrency(tx.amount) : '-',
      formatPdfCurrency(runningBal),
    ];
  });

  // Calculate totals
  const totalCredit = sortedTx.filter(t => t.type === 'CREDIT').reduce((acc, t) => acc + t.amount, 0);
  const totalPayment = sortedTx.filter(t => t.type === 'PAYMENT').reduce((acc, t) => acc + t.amount, 0);

  autoTable(doc, {
    startY: currentY,
    head: [
      ['#', 'Date', 'Description / Particulars', 'Type', 'Mode', 'Credit (+)', 'Paid (-)', 'Balance'],
    ],
    body: tableRows,
    foot: [
      [
        '',
        '',
        'TOTALS',
        `${sortedTx.length} Entries`,
        '',
        formatPdfCurrency(totalCredit),
        formatPdfCurrency(totalPayment),
        formatPdfCurrency(runningBal),
      ],
    ],
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.8,
      textColor: [30, 41, 59],
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 23 },
      4: { cellWidth: 17 },
      5: { cellWidth: 21, halign: 'right', textColor: [225, 29, 72] },
      6: { cellWidth: 21, halign: 'right', textColor: [16, 185, 129] },
      7: { cellWidth: 23, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin, bottom: 25 },
    didDrawPage: (data) => {
      // Footer on every page
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = data.pageNumber;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...mutedTextColor);

      // Top divider line for footer
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      // Bottom footer text
      doc.text(
        'Generated via CreditTrack - Digital Bahi-Khata. Thank you for your business!',
        margin,
        pageHeight - 7
      );

      doc.text(
        `Page ${currentPage} of ${pageCount}`,
        pageWidth - margin,
        pageHeight - 7,
        { align: 'right' }
      );
    },
  });

  // End of Document: Sign-off & Payment Remittance Note
  const lastY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : currentY + 40;
  if (lastY < pageHeight - 35) {
    if (customer.outstandingBalance > 0 && business?.upi_id) {
      doc.setFillColor(254, 242, 242); // Rose 50
      doc.setDrawColor(254, 205, 211); // Rose 200
      doc.roundedRect(margin, lastY, pageWidth - margin * 2, 14, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(190, 18, 60);
      doc.text(
        `PAYMENT NOTICE: Outstanding balance of ${formatPdfCurrency(customer.outstandingBalance)} is due for settlement.`,
        margin + 4,
        lastY + 5
      );
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(159, 18, 57);
      doc.text(
        `Please make payment to UPI ID: ${business.upi_id} (${business.upi_name || business.business_name}) or settle in person at the store counter.`,
        margin + 4,
        lastY + 10
      );
    }

    // Signature stamp lines on the right
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...mutedTextColor);
    const signY = Math.min(lastY + 22, pageHeight - 20);
    doc.line(pageWidth - margin - 45, signY, pageWidth - margin, signY);
    doc.text('Authorized Signatory / Stamp', pageWidth - margin - 22.5, signY + 4, { align: 'center' });
  }

  // Save the PDF file
  const sanitizedCustomer = customer.name.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStamp = new Date().toISOString().slice(0, 10);
  doc.save(`Statement_${sanitizedCustomer}_${dateStamp}.pdf`);

  return doc;
}

/**
 * Generates and downloads a formatted Store Transactions / Ledger Report PDF
 */
export function generateTransactionsLedgerPDF({
  transactions,
  business,
  filters,
}: TransactionsLedgerPdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  const primaryColor: [number, number, number] = [5, 150, 105]; // Emerald
  const darkTextColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const mutedTextColor: [number, number, number] = [100, 116, 139]; // Slate 500

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(margin, currentY, pageWidth - margin * 2, 2.5, 'F');
  currentY += 6;

  // Store Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...primaryColor);
  const storeName = business?.business_name || 'CreditTrack Store';
  doc.text(storeName, margin, currentY);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...darkTextColor);
  doc.text('BUSINESS TRANSACTION LEDGER REPORT (KHATA)', pageWidth - margin, currentY, { align: 'right' });
  currentY += 5;

  // Metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedTextColor);
  const storeType = business?.business_type || 'Udhaar & Jama Ledger';
  doc.text(storeType, margin, currentY);

  doc.text(`Generated: ${formatPdfDateTime(new Date().toISOString())}`, pageWidth - margin, currentY, { align: 'right' });
  currentY += 4;

  const filterSummary = [
    filters?.dateRange ? `Date Scope: ${filters.dateRange}` : 'All Dates',
    filters?.typeFilter ? `Type: ${filters.typeFilter}` : 'All Types',
    filters?.search ? `Filter: "${filters.search}"` : '',
  ].filter(Boolean).join(' | ');

  doc.text(`Filter Applied: ${filterSummary}`, margin, currentY);
  currentY += 6;

  // Calculate metrics
  const totalCredit = transactions
    .filter((t) => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalPayment = transactions
    .filter((t) => t.type === 'PAYMENT')
    .reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalCredit - totalPayment;

  // Summary Metrics Bar
  const boxWidth = (pageWidth - margin * 2 - 12) / 4;
  const boxHeight = 14;

  // Metric 1: Total Records
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, boxWidth, boxHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, boxWidth, boxHeight, 1.5, 1.5, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedTextColor);
  doc.text('TOTAL TRANSACTIONS', margin + 3, currentY + 4.5);
  doc.setFontSize(10);
  doc.setTextColor(...darkTextColor);
  doc.text(`${transactions.length} Entries`, margin + 3, currentY + 10.5);

  // Metric 2: Credit Given (Udhaar)
  const m2X = margin + boxWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(m2X, currentY, boxWidth, boxHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(m2X, currentY, boxWidth, boxHeight, 1.5, 1.5, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedTextColor);
  doc.text('TOTAL CREDIT GIVEN (UDHAAR)', m2X + 3, currentY + 4.5);
  doc.setFontSize(10);
  doc.setTextColor(225, 29, 72);
  doc.text(formatPdfCurrency(totalCredit), m2X + 3, currentY + 10.5);

  // Metric 3: Payments Received (Jama)
  const m3X = m2X + boxWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(m3X, currentY, boxWidth, boxHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(m3X, currentY, boxWidth, boxHeight, 1.5, 1.5, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedTextColor);
  doc.text('PAYMENTS RECEIVED (JAMA)', m3X + 3, currentY + 4.5);
  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129);
  doc.text(formatPdfCurrency(totalPayment), m3X + 3, currentY + 10.5);

  // Metric 4: Net Balance Difference
  const m4X = m3X + boxWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(m4X, currentY, boxWidth, boxHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(m4X, currentY, boxWidth, boxHeight, 1.5, 1.5, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedTextColor);
  doc.text('NET BALANCE POSITION', m4X + 3, currentY + 4.5);
  doc.setFontSize(10);
  doc.setTextColor(netBalance > 0 ? 225 : 16, netBalance > 0 ? 29 : 185, netBalance > 0 ? 72 : 129);
  doc.text(formatPdfCurrency(netBalance), m4X + 3, currentY + 10.5);

  currentY += boxHeight + 6;

  // 2. Ledger AutoTable
  const tableRows = transactions.map((tx, idx) => {
    let desc = tx.description || (tx.type === 'CREDIT' ? 'Credit udhaar' : 'Customer payment');
    if (tx.items && tx.items.length > 0) {
      const itemsStr = tx.items.map(it => `${it.name} x${it.quantity}`).join(', ');
      desc = `${desc} (${itemsStr})`;
    }

    return [
      (idx + 1).toString(),
      formatPdfDate(tx.transaction_date),
      tx.customerName || 'Customer',
      tx.customerPhone ? tx.customerPhone : '-',
      tx.type === 'CREDIT' ? 'UDHAAR (+)' : 'JAMA (-)',
      desc,
      tx.payment_method || (tx.type === 'CREDIT' ? 'Account Credit' : 'Cash'),
      formatPdfCurrency(tx.amount),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [
      ['#', 'Date', 'Customer Name', 'Phone', 'Type', 'Particulars / Description', 'Payment Method', 'Amount'],
    ],
    body: tableRows,
    foot: [
      [
        '',
        '',
        'TOTAL SUMMARY',
        '',
        `${transactions.length} records`,
        `Udhaar: ${formatPdfCurrency(totalCredit)} | Jama: ${formatPdfCurrency(totalPayment)}`,
        'Net:',
        formatPdfCurrency(netBalance),
      ],
    ],
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.8,
      textColor: [30, 41, 59],
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 24 },
      2: { cellWidth: 42, fontStyle: 'bold' },
      3: { cellWidth: 28 },
      4: { cellWidth: 26 },
      5: { cellWidth: 'auto' },
      6: { cellWidth: 32 },
      7: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin, bottom: 20 },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = data.pageNumber;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...mutedTextColor);

      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      doc.text(
        `CreditTrack Digital Bahi-Khata - Official Transaction Ledger Report`,
        margin,
        pageHeight - 7
      );

      doc.text(
        `Page ${currentPage} of ${pageCount}`,
        pageWidth - margin,
        pageHeight - 7,
        { align: 'right' }
      );
    },
  });

  const dateStamp = new Date().toISOString().slice(0, 10);
  doc.save(`CreditTrack_Ledger_Report_${dateStamp}.pdf`);

  return doc;
}
