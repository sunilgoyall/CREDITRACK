/**
 * Formats a number to Indian Rupee representation (e.g. ₹1,25,000 or ₹7,500.50)
 */
export function formatINR(amount: number, includeDecimals = false): string {
  if (isNaN(amount)) return '₹0';
  
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formatted = '';
  if (includeDecimals || absAmount % 1 !== 0) {
    formatted = absAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    formatted = absAmount.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    });
  }

  return `${isNegative ? '-' : ''}₹${formatted}`;
}

/**
 * Formats date string into readable Indian format (e.g., "21 Sep 2026")
 */
export function formatDate(dateString: string, includeTime = false): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };

    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = true;
    }

    return date.toLocaleDateString('en-IN', options);
  } catch {
    return dateString;
  }
}

/**
 * Returns formatted relative time (e.g., "Today", "Yesterday", or "3 days ago")
 */
export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'No activity';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  } catch {
    return 'Recently';
  }
}

/**
 * Formats phone number into standard display
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  const clean = phone.replace(/[^\d+]/g, '');
  if (clean.length === 10 && !clean.startsWith('+')) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return phone;
}

/**
 * Generates an official, courteous WhatsApp payment reminder URL
 */
export function generateWhatsAppReminder(params: {
  customerName: string;
  customerPhone: string;
  businessName: string;
  outstandingAmount: number;
  daysOverdue?: number;
  upiId?: string;
  lang?: 'en' | 'hi';
}): string {
  const { customerName, customerPhone, businessName, outstandingAmount, daysOverdue, upiId, lang = 'en' } = params;
  
  // Clean phone number for WhatsApp wa.me link
  let cleanPhone = customerPhone.replace(/[^\d]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  const formattedAmt = formatINR(outstandingAmount);
  const upiInfo = upiId ? `\nUPI Payment ID: *${upiId}*` : '';
  const overdueInfoEn = daysOverdue && daysOverdue > 0 ? ` (Pending for ${daysOverdue} days)` : '';
  const overdueInfoHi = daysOverdue && daysOverdue > 0 ? ` (${daysOverdue} दिनों से बकाया)` : '';

  let message = '';
  if (lang === 'hi') {
    message = `नमस्ते ${customerName} जी,\n\nयह ${businessName} की तरफ से एक विनम्र अनुस्मारक (reminder) है।\n\nआपके खाते में कुल बकाया राशि: *${formattedAmt}* है${overdueInfoHi}।${upiInfo}\n\nकृपया सुविधानुसार इसका भुगतान करें। किसी भी जानकारी के लिए हमसे संपर्क करें।\n\nधन्यवाद! 🙏`;
  } else {
    message = `Dear ${customerName},\n\nThis is a friendly reminder from *${businessName}* regarding your store account.\n\nYour current outstanding balance is *${formattedAmt}*${overdueInfoEn}.${upiInfo}\n\nKindly arrange the payment at your earliest convenience. Thank you for your business! 🙏`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates an official, courteous SMS payment reminder URL (sms: URI)
 */
export function generateSmsReminder(params: {
  customerName: string;
  customerPhone: string;
  businessName: string;
  outstandingAmount: number;
  daysOverdue?: number;
  upiId?: string;
  lang?: 'en' | 'hi';
}): { url: string; message: string } {
  const { customerName, customerPhone, businessName, outstandingAmount, daysOverdue, upiId, lang = 'en' } = params;

  let cleanPhone = customerPhone.replace(/[^\d+]/g, '');
  if (cleanPhone.length === 10 && !cleanPhone.startsWith('+')) {
    cleanPhone = '+91' + cleanPhone;
  }

  const formattedAmt = formatINR(outstandingAmount);
  const upiInfo = upiId ? ` UPI: ${upiId}.` : '';
  const overdueInfoEn = daysOverdue && daysOverdue > 0 ? ` (Unpaid for ${daysOverdue} days)` : '';
  const overdueInfoHi = daysOverdue && daysOverdue > 0 ? ` (${daysOverdue} दिनों से बकाया)` : '';

  let message = '';
  if (lang === 'hi') {
    message = `नमस्ते ${customerName} जी, ${businessName} की ओर से अनुस्मारक: आपके खाते की बकाया राशि ${formattedAmt} है${overdueInfoHi}.${upiInfo} कृपया जल्द भुगतान करें। धन्यवाद!`;
  } else {
    message = `Dear ${customerName}, Reminder from ${businessName}: Your outstanding balance is ${formattedAmt}${overdueInfoEn}.${upiInfo} Please arrange payment at your earliest convenience. Thank you!`;
  }

  // Cross-platform SMS URL:
  // On iOS: sms:+91...?&body=... or sms:+91...;body=...
  // Standard: sms:+91...?body=...
  const url = `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
  return { url, message };
}
