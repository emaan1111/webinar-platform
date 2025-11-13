export function normalizeReferralPlaceholders(html: string) {
  if (!html || !html.includes('{{referralLink}}')) {
    return html
  }

  let normalized = html

  // Ensure assignments use quoted referral links
  normalized = normalized.replace(/=\s*\{\{referralLink\}\};/g, '= "{{referralLink}}";')

  // Handle explicit const link assignments without quotes
  normalized = normalized.replace(/const\s+link\s*=\s*\{\{referralLink\}\};/g, 'const link = "{{referralLink}}";')

  // Break string literals so referralLink is concatenated instead of inserted raw
  normalized = normalized.replace(/\{\{referralLink\}\}";/g, '" + "{{referralLink}}";')
  normalized = normalized.replace(/\{\{referralLink\}\}';/g, "' + \"{{referralLink}}\";")

  return normalized
}
