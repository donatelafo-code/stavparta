import nodemailer from 'nodemailer';
import { Lead, SiteSettings } from '../src/types';

export interface NotificationDispatchResult {
  ownerEmailSent: boolean;
  customerEmailSent: boolean;
  telegramSent: boolean;
  warnings: string[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function dispatchNewLeadNotifications(
  lead: Lead,
  settings: SiteSettings
): Promise<NotificationDispatchResult> {
  const warnings: string[] = [];
  let ownerEmailSent = false;
  let customerEmailSent = false;
  let telegramSent = false;

  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = process.env.SMTP_SECURE === 'true';
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const smtpFrom =
    process.env.SMTP_FROM?.trim() || `STAVPARTA Web <${smtpUser || settings.email}>`;
  const ownerRecipient =
    process.env.NOTIFY_EMAIL?.trim() ||
    (settings.notifyEmailEnabled && settings.notifyEmailAddress
      ? settings.notifyEmailAddress.trim()
      : '');

  if (!smtpHost || !smtpUser || !smtpPass) {
    const msg =
      'SMTP notifikace nejsou nakonfigurovány (chybí SMTP_HOST / SMTP_USER / SMTP_PASS). Poptávka byla uložena do databáze bez odeslání e-mailu.';
    console.warn(`[notifications] ${msg}`);
    warnings.push(msg);
  } else {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      if (ownerRecipient) {
        const coreBlock = lead.coreDetails
          ? `<p><strong>Detaily bytového jádra:</strong><br/>
             Typ: ${escapeHtml(lead.coreDetails.propertyType || '-')}<br/>
             Rozsah: ${escapeHtml(lead.coreDetails.scope || '-')}<br/>
             Dispozice: ${escapeHtml(lead.coreDetails.dispositionChange || '-')}<br/>
             Návrh: ${escapeHtml(lead.coreDetails.designStatus || '-')}</p>`
          : '';

        await transporter.sendMail({
          from: smtpFrom,
          to: ownerRecipient,
          replyTo: lead.email,
          subject: `[STAVPARTA] Nová poptávka #${lead.id} – ${lead.serviceTitle} (${lead.location})`,
          text: [
            `Nová poptávka #${lead.id}`,
            `Služba: ${lead.serviceTitle}`,
            `Zákazník: ${lead.name}`,
            `E-mail: ${lead.email}`,
            `Telefon: ${lead.phone || 'neuveden'}`,
            `Lokalita: ${lead.location}`,
            `Termín: ${lead.preferredTimeline || 'neuveden'}`,
            '',
            lead.description,
          ].join('\n'),
          html: `
            <h2>Nová poptávka z webu STAVPARTA (#${escapeHtml(lead.id)})</h2>
            <p><strong>Služba:</strong> ${escapeHtml(lead.serviceTitle)}</p>
            <p><strong>Jméno:</strong> ${escapeHtml(lead.name)}<br/>
               <strong>E-mail:</strong> ${escapeHtml(lead.email)}<br/>
               <strong>Telefon:</strong> ${escapeHtml(lead.phone || 'neuveden')}<br/>
               <strong>Místo stavby:</strong> ${escapeHtml(lead.location)}<br/>
               <strong>Termín:</strong> ${escapeHtml(lead.preferredTimeline || 'neuveden')}</p>
            ${coreBlock}
            <p><strong>Popis požadavku:</strong><br/>${escapeHtml(lead.description).replace(/\n/g, '<br/>')}</p>
          `,
        });
        ownerEmailSent = true;
      } else {
        const msg = 'Chybí NOTIFY_EMAIL pro odeslání upozornění majiteli.';
        console.warn(`[notifications] ${msg}`);
        warnings.push(msg);
      }

      await transporter.sendMail({
        from: smtpFrom,
        to: lead.email,
        subject: `Potvrzení poptávky #${lead.id} | STAVPARTA`,
        text: [
          `Dobrý den, ${lead.name},`,
          '',
          `děkujeme za vaši nezávaznou poptávku (${lead.serviceTitle} – ${lead.location}).`,
          `Vaše evidenční číslo poptávky je #${lead.id}.`,
          'Ozve se vám koordinátor stavby pro upřesnění detailů a domluvu zaměření.',
          '',
          'S pozdravem,',
          settings.companyName,
          `Centrála: ${settings.headquarters || 'Zábřeh na Moravě'}`,
        ].join('\n'),
        html: `
          <p>Dobrý den, ${escapeHtml(lead.name)},</p>
          <p>děkujeme za vaši nezávaznou poptávku na <strong>${escapeHtml(lead.serviceTitle)}</strong> (${escapeHtml(lead.location)}).</p>
          <p>Evidenční číslo vaší poptávky je <strong>#${escapeHtml(lead.id)}</strong>. Brzy se vám ozveme pro domluvení bezplatného zaměření.</p>
          <p>S pozdravem,<br/><strong>${escapeHtml(settings.companyName)}</strong></p>
        `,
      });
      customerEmailSent = true;
    } catch (err) {
      const msg = `Chyba při odesílání SMTP e-mailu: ${err instanceof Error ? err.message : 'neznámá chyba'}`;
      console.warn(`[notifications] ${msg}`);
      warnings.push(msg);
    }
  }

  const tgToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const tgChatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (tgToken && tgChatId) {
    try {
      const tgText = [
        `Nová poptávka #${lead.id}`,
        `Služba: ${lead.serviceTitle}`,
        `Zákazník: ${lead.name} (${lead.location})`,
        `Tel: ${lead.phone || '-'} | Email: ${lead.email}`,
        `Popis: ${lead.description.slice(0, 300)}`,
      ].join('\n');

      const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: tgText,
        }),
      });
      if (!tgRes.ok) {
        const msg = `Telegram webhook vrátil HTTP ${tgRes.status}`;
        console.warn(`[notifications] ${msg}`);
        warnings.push(msg);
      } else {
        telegramSent = true;
      }
    } catch (err) {
      const msg = `Chyba Telegram notifikace: ${err instanceof Error ? err.message : 'neznámá chyba'}`;
      console.warn(`[notifications] ${msg}`);
      warnings.push(msg);
    }
  }

  return {
    ownerEmailSent,
    customerEmailSent,
    telegramSent,
    warnings,
  };
}
