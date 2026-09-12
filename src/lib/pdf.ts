import type { Ticket, Customer, Sale } from './supabase';
import { TICKET_STATUS_LABELS, TICKET_TYPE_LABELS } from './supabase';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR');
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('pt-BR');
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function generateTicketPDF(ticket: Ticket, customer: Customer | undefined): string {
  const customerName = customer?.name || '[Cliente não encontrado]';
  const customerPhone = customer?.phone || '-';
  const customerEmail = customer?.email || '-';
  const customerAddress = customer
    ? [customer.address, customer.city, customer.state].filter(Boolean).join(', ')
    : '-';

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 2cm; }
  body {
    font-family: 'Helvetica', Arial, sans-serif;
    color: #333;
    position: relative;
    line-height: 1.6;
  }
  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 72px;
    color: rgba(200, 170, 110, 0.08);
    z-index: -1;
    font-weight: bold;
    white-space: nowrap;
    pointer-events: none;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 3px solid #C9A96E;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  .header-left { font-size: 20px; font-weight: bold; color: #8B6914; }
  .header-right { font-size: 12px; color: #666; text-align: right; }
  .title {
    font-size: 18px;
    font-weight: bold;
    color: #5C3D1E;
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .ticket-info {
    background: #F5F0EB;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
  }
  .info-row {
    display: flex;
    margin-bottom: 8px;
  }
  .info-label {
    font-weight: bold;
    width: 180px;
    color: #5C3D1E;
  }
  .info-value { flex: 1; }
  .status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 12px;
    text-transform: uppercase;
  }
  .status-pending { background: #FFF3E0; color: #FF9800; }
  .status-assigned { background: #E3F2FD; color: #1976D2; }
  .status-in_progress { background: #E3F2FD; color: #1565C0; }
  .status-completed { background: #E8F5E9; color: #2E7D32; }
  .status-cancelled { background: #FFEBEE; color: #C62828; }
  .section-title {
    font-size: 14px;
    font-weight: bold;
    color: #5C3D1E;
    margin-top: 20px;
    margin-bottom: 8px;
    border-left: 4px solid #C9A96E;
    padding-left: 8px;
  }
  .description-box {
    background: #FAFAFA;
    border: 1px solid #E0E0E0;
    border-radius: 4px;
    padding: 12px;
    min-height: 60px;
  }
  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #E0E0E0;
    text-align: center;
    font-size: 11px;
    color: #999;
  }
  .signature-area {
    margin-top: 60px;
    text-align: center;
  }
  .signature-line {
    width: 300px;
    margin: 0 auto;
    border-top: 1px solid #333;
    padding-top: 8px;
    font-size: 12px;
    color: #666;
  }
</style>
</head>
<body>
  <div class="watermark">${customerName}</div>

  <div class="header">
    <div class="header-left">[Nome da Empresa]</div>
    <div class="header-right">
      Documento gerado em: ${new Date().toLocaleString('pt-BR')}<br>
      Protocolo: #${String(ticket.ticket_number).padStart(5, '0')}
    </div>
  </div>

  <div class="title">Comprovante de Atendimento</div>

  <div class="ticket-info">
    <div class="info-row">
      <div class="info-label">Número do Protocolo:</div>
      <div class="info-value">#${String(ticket.ticket_number).padStart(5, '0')}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Tipo de Atendimento:</div>
      <div class="info-value">${TICKET_TYPE_LABELS[ticket.ticket_type]}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Status:</div>
      <div class="info-value">
        <span class="status-badge status-${ticket.status}">${TICKET_STATUS_LABELS[ticket.status]}</span>
      </div>
    </div>
    <div class="info-row">
      <div class="info-label">Data de Abertura:</div>
      <div class="info-value">${formatDateTime(ticket.created_at)}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Data Agendada:</div>
      <div class="info-value">${formatDate(ticket.scheduled_date)} ${ticket.scheduled_time || ''}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Técnico Responsável:</div>
      <div class="info-value">${ticket.technician?.name || 'Não atribuído'}</div>
    </div>
  </div>

  <div class="section-title">Dados do Cliente</div>
  <div class="ticket-info">
    <div class="info-row">
      <div class="info-label">Nome:</div>
      <div class="info-value">${customerName}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Telefone:</div>
      <div class="info-value">${customerPhone}</div>
    </div>
    <div class="info-row">
      <div class="info-label">E-mail:</div>
      <div class="info-value">${customerEmail}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Endereço:</div>
      <div class="info-value">${customerAddress}</div>
    </div>
  </div>

  <div class="section-title">Descrição do Atendimento</div>
  <div class="description-box">${ticket.description || 'Sem descrição fornecida.'}</div>

  ${ticket.notes ? `
  <div class="section-title">Observações Técnicas</div>
  <div class="description-box">${ticket.notes}</div>
  ` : ''}

  ${ticket.completed_at ? `
  <div class="section-title">Conclusão</div>
  <div class="ticket-info">
    <div class="info-row">
      <div class="info-label">Data de Conclusão:</div>
      <div class="info-value">${formatDateTime(ticket.completed_at)}</div>
    </div>
  </div>
  ` : ''}

  <div class="signature-area">
    <div class="signature-line">Assinatura do Responsável</div>
  </div>

  <div class="footer">
    [Nome da Empresa] &middot; Sistema de Gestão Operacional<br>
    Documento gerado automaticamente
  </div>
</body>
</html>
  `;

  return html;
}

export function generateSalePDF(sale: Sale, customer: Customer | undefined): string {
  const customerName = customer?.name || '[Cliente não encontrado]';
  const customerPhone = customer?.phone || '-';
  const customerEmail = customer?.email || '-';

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 2cm; }
  body {
    font-family: 'Helvetica', Arial, sans-serif;
    color: #333;
    position: relative;
    line-height: 1.6;
  }
  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 72px;
    color: rgba(200, 170, 110, 0.08);
    z-index: -1;
    font-weight: bold;
    white-space: nowrap;
    pointer-events: none;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 3px solid #C9A96E;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  .header-left { font-size: 20px; font-weight: bold; color: #8B6914; }
  .header-right { font-size: 12px; color: #666; text-align: right; }
  .title {
    font-size: 18px;
    font-weight: bold;
    color: #5C3D1E;
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .info-box {
    background: #F5F0EB;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
  }
  .info-row {
    display: flex;
    margin-bottom: 8px;
  }
  .info-label { font-weight: bold; width: 180px; color: #5C3D1E; }
  .info-value { flex: 1; }
  .totals-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 16px;
  }
  .totals-table td {
    padding: 8px 12px;
    border-bottom: 1px solid #E0E0E0;
  }
  .totals-table .total-row {
    font-weight: bold;
    background: #F5F0EB;
    font-size: 16px;
    color: #5C3D1E;
  }
  .section-title {
    font-size: 14px;
    font-weight: bold;
    color: #5C3D1E;
    margin-top: 20px;
    margin-bottom: 8px;
    border-left: 4px solid #C9A96E;
    padding-left: 8px;
  }
  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #E0E0E0;
    text-align: center;
    font-size: 11px;
    color: #999;
  }
  .signature-area {
    margin-top: 60px;
    text-align: center;
  }
  .signature-line {
    width: 300px;
    margin: 0 auto;
    border-top: 1px solid #333;
    padding-top: 8px;
    font-size: 12px;
    color: #666;
  }
</style>
</head>
<body>
  <div class="watermark">${customerName}</div>

  <div class="header">
    <div class="header-left">[Nome da Empresa]</div>
    <div class="header-right">
      Documento gerado em: ${new Date().toLocaleString('pt-BR')}<br>
      Venda: #${String(sale.sale_number).padStart(5, '0')}
    </div>
  </div>

  <div class="title">Comprovante de Venda</div>

  <div class="info-box">
    <div class="info-row">
      <div class="info-label">Número:</div>
      <div class="info-value">#${String(sale.sale_number).padStart(5, '0')}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Data da Venda:</div>
      <div class="info-value">${formatDate(sale.sale_date)}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Cliente:</div>
      <div class="info-value">${customerName}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Telefone:</div>
      <div class="info-value">${customerPhone}</div>
    </div>
    <div class="info-row">
      <div class="info-label">E-mail:</div>
      <div class="info-value">${customerEmail}</div>
    </div>
  </div>

  <div class="section-title">Detalhes do Plano</div>
  <div class="info-box">
    <div class="info-row">
      <div class="info-label">Plano/Produto:</div>
      <div class="info-value">${sale.plan?.name || '-'} ${sale.variation ? `(${sale.variation})` : ''}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Forma de Pagamento:</div>
      <div class="info-value">${sale.payment_method || '-'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Condição:</div>
      <div class="info-value">${sale.payment_condition || '-'}</div>
    </div>
  </div>

  <div class="section-title">Valores</div>
  <table class="totals-table">
    <tr>
      <td>Valor Original</td>
      <td style="text-align: right;">${formatCurrency(sale.amount)}</td>
    </tr>
    ${sale.has_discount ? `
    <tr>
      <td>Desconto</td>
      <td style="text-align: right; color: #C62828;">- ${formatCurrency(sale.discount_value)}</td>
    </tr>
    ` : ''}
    <tr class="total-row">
      <td>Total</td>
      <td style="text-align: right;">${formatCurrency(sale.final_amount)}</td>
    </tr>
  </table>

  ${sale.notes ? `
  <div class="section-title">Observações</div>
  <div class="info-box">${sale.notes}</div>
  ` : ''}

  <div class="signature-area">
    <div class="signature-line">Assinatura do Responsável</div>
  </div>

  <div class="footer">
    [Nome da Empresa] &middot; Sistema de Gestão Operacional<br>
    Documento gerado automaticamente
  </div>
</body>
</html>
  `;

  return html;
}

export function openPDF(htmlContent: string) {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onload = () => {
      win.print();
    };
  }
}
