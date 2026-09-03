/**
 * API Route: POST /api/print
 *
 * Recebe um job de impressão e envia os bytes ESC/POS diretamente para
 * a impressora via socket TCP (porta 9100 padrão — protocolo RAW).
 *
 * IMPORTANTE: Esta rota funciona quando o Next.js está na mesma rede
 * das impressoras (ex: npm run dev no PC do restaurante).
 * Na Vercel (cloud), retorna erro orientativo.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as net from 'net';
import { buildKitchenTicket, buildCounterReceipt, buildTestPage } from '../../../server/lib/escpos.ts';
import type { KitchenOrder, PrintJobPayload } from '../../../src/types/index.ts';

/** Envia um Buffer para uma impressora via TCP socket */
function sendToSocket(host: string, port: number, data: Buffer, timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let done = false;

    const finish = (err?: Error) => {
      if (done) return;
      done = true;
      socket.destroy();
      if (err) reject(err);
      else resolve();
    };

    socket.setTimeout(timeoutMs);
    socket.on('timeout', () => finish(new Error(`Timeout: impressora ${host}:${port} nao respondeu em ${timeoutMs}ms`)));
    socket.on('error', (err) => finish(err));
    socket.connect(port, host, () => {
      socket.write(data, (err) => {
        if (err) finish(err);
        else finish();
      });
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, order, paperWidth, printerIp, printerPort, autoCut, isTest, printerName } = body as {
      target: 'balcao' | 'cozinha' | 'test';
      order?: KitchenOrder;
      paperWidth: '80mm' | '58mm';
      printerIp: string;
      printerPort: number;
      autoCut: boolean;
      isTest?: boolean;
      printerName?: string;
    };

    // Validações básicas
    if (!printerIp || !printerIp.trim()) {
      return NextResponse.json(
        { sucesso: false, mensagem: 'IP da impressora nao configurado. Configure em Impressoras > Configuracoes.' },
        { status: 400 }
      );
    }

    const port = printerPort || 9100;
    const width = paperWidth || '80mm';
    const cut = autoCut !== false; // padrão: true

    let printData: Buffer;

    if (isTest) {
      // Página de teste
      printData = buildTestPage(printerName || target, width, cut);
    } else if (!order) {
      return NextResponse.json(
        { sucesso: false, mensagem: 'Dados do pedido nao fornecidos.' },
        { status: 400 }
      );
    } else if (target === 'cozinha') {
      printData = buildKitchenTicket(order, width, cut);
    } else {
      // balcao ou completo
      printData = buildCounterReceipt(order, width, cut);
    }

    // Tentativa de envio via TCP
    try {
      await sendToSocket(printerIp, port, printData);
      return NextResponse.json({
        sucesso: true,
        mensagem: `Impresso com sucesso em ${printerIp}:${port}`,
        target,
        ip: printerIp
      });
    } catch (socketErr: any) {
      // Verifica se estamos em ambiente cloud (Vercel) ou rede local
      const isCloudEnv = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;

      if (isCloudEnv) {
        return NextResponse.json(
          {
            sucesso: false,
            mensagem: `Impressao direta via IP nao funciona no Vercel (cloud). Use "Imprimir via Navegador" ou rode o sistema localmente (npm run dev) na mesma rede das impressoras.`,
            target,
            ip: printerIp
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          sucesso: false,
          mensagem: `Falha ao conectar em ${printerIp}:${port}. Verifique se a impressora esta ligada e na mesma rede. Detalhe: ${socketErr.message}`,
          target,
          ip: printerIp
        },
        { status: 502 }
      );
    }
  } catch (err: any) {
    console.error('[/api/print] Erro interno:', err);
    return NextResponse.json(
      { sucesso: false, mensagem: `Erro interno: ${err.message}` },
      { status: 500 }
    );
  }
}
