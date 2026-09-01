import React, { useState } from 'react';
import { CardPaymentPayload } from '../types/index.ts';
import {
  CreditCard,
  Lock,
  ShieldCheck,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface OnlineCardFormProps {
  totalAmount: number;
  onCardDataChange: (data: {
    cardNumber: string;
    cardholderName: string;
    cardExpMonth: string;
    cardExpYear: string;
    cardCvv: string;
    cpf: string;
    installments: number;
    isValid: boolean;
  }) => void;
}

export function OnlineCardForm({ totalAmount, onCardDataChange }: OnlineCardFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cpf, setCpf] = useState('');
  const [installments, setInstallments] = useState(1);

  // Card brand detection
  const cleanCard = cardNumber.replace(/\D/g, '');
  let brand = 'Cartão';
  if (/^4/.test(cleanCard)) brand = 'Visa';
  else if (/^5[1-5]/.test(cleanCard)) brand = 'Mastercard';
  else if (/^3[47]/.test(cleanCard)) brand = 'American Express';
  else if (/^(606282|3841)/.test(cleanCard)) brand = 'Hipercard';
  else if (/^(4011|5041|5067|5090|6277|6362|6363)/.test(cleanCard)) brand = 'Elo';

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 16) v = v.slice(0, 16);
    const formatted = v.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
    notifyParent(formatted, cardholderName, expiry, cardCvv, cpf, installments);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 4) v = v.slice(0, 4);
    if (v.length > 2) {
      v = `${v.slice(0, 2)}/${v.slice(2)}`;
    }
    setExpiry(v);
    notifyParent(cardNumber, cardholderName, v, cardCvv, cpf, installments);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 9) {
      v = v.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    } else if (v.length > 6) {
      v = v.replace(/^(\d{3})(\d{3})(\d{0,3})$/, '$1.$2.$3');
    } else if (v.length > 3) {
      v = v.replace(/^(\d{3})(\d{0,3})$/, '$1.$2');
    }
    setCpf(v);
    notifyParent(cardNumber, cardholderName, expiry, cardCvv, v, installments);
  };

  const notifyParent = (
    cNum: string,
    cName: string,
    cExp: string,
    cCvv: string,
    cCpf: string,
    cInst: number
  ) => {
    const rawCard = cNum.replace(/\D/g, '');
    const [month, year] = cExp.split('/');
    const isValid =
      rawCard.length >= 13 &&
      cName.trim().length >= 3 &&
      cExp.length === 5 &&
      cCvv.length >= 3 &&
      cCpf.replace(/\D/g, '').length === 11;

    onCardDataChange({
      cardNumber: rawCard,
      cardholderName: cName.trim(),
      cardExpMonth: month || '',
      cardExpYear: year ? `20${year}` : '',
      cardCvv: cCvv,
      cpf: cCpf,
      installments: cInst,
      isValid
    });
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white">Dados do Cartão de Crédito Online</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Checkout Seguro SSL</span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Card Number */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
            <span>Número do Cartão:</span>
            {cleanCard.length > 0 && (
              <span className="text-[10px] text-amber-400 font-bold uppercase">{brand}</span>
            )}
          </label>
          <div className="relative">
            <input
              type="text"
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
            />
            <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Cardholder Name */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300">
            Nome Completo do Titular (como está no cartão):
          </label>
          <input
            type="text"
            value={cardholderName}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              setCardholderName(val);
              notifyParent(cardNumber, val, expiry, cardCvv, cpf, installments);
            }}
            placeholder="NOME IMPRESSO"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white uppercase text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Expiry & CVV */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Validade (MM/AA):</label>
            <input
              type="text"
              value={expiry}
              onChange={handleExpiryChange}
              placeholder="MM/AA"
              maxLength={5}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">CVV (Código):</label>
            <input
              type="password"
              value={cardCvv}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                setCardCvv(val);
                notifyParent(cardNumber, cardholderName, expiry, val, cpf, installments);
              }}
              placeholder="123"
              maxLength={4}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* CPF do Titular */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300">
            CPF do Titular do Cartão:
          </label>
          <input
            type="text"
            value={cpf}
            onChange={handleCpfChange}
            placeholder="000.000.000-00"
            maxLength={14}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Installments (Parcelamento) */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300">Opções de Parcelamento:</label>
          <select
            value={installments}
            onChange={(e) => {
              const val = Number(e.target.value);
              setInstallments(val);
              notifyParent(cardNumber, cardholderName, expiry, cardCvv, cpf, val);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
          >
            <option value={1}>1x de R$ {totalAmount.toFixed(2).replace('.', ',')} (sem juros)</option>
            <option value={2}>2x de R$ {(totalAmount / 2).toFixed(2).replace('.', ',')} (sem juros)</option>
            <option value={3}>3x de R$ {(totalAmount / 3).toFixed(2).replace('.', ',')} (sem juros)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
