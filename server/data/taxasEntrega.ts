import type { BairroDelivery } from '../../src/types/index.ts';

export const BAIRROS_DF: BairroDelivery[] = [
  {
    id: 'asa-norte',
    nome: 'Asa Norte (Plano Piloto)',
    regiao: 'Plano Piloto',
    taxaEntrega: 6.90,
    tempoMin: 25,
    tempoMax: 40,
    freteGratisMin: 90,
    ativo: true
  },
  {
    id: 'asa-sul',
    nome: 'Asa Sul (Plano Piloto)',
    regiao: 'Plano Piloto',
    taxaEntrega: 7.90,
    tempoMin: 30,
    tempoMax: 45,
    freteGratisMin: 95,
    ativo: true
  },
  {
    id: 'sudoeste',
    nome: 'Sudoeste & Octogonal',
    regiao: 'Sudoeste/Octogonal',
    taxaEntrega: 7.90,
    tempoMin: 25,
    tempoMax: 40,
    freteGratisMin: 90,
    ativo: true
  },
  {
    id: 'noroeste',
    nome: 'Noroeste',
    regiao: 'Plano Piloto',
    taxaEntrega: 8.90,
    tempoMin: 25,
    tempoMax: 40,
    freteGratisMin: 95,
    ativo: true
  },
  {
    id: 'lago-norte',
    nome: 'Lago Norte (SHIN e MI)',
    regiao: 'Lago Norte',
    taxaEntrega: 9.90,
    tempoMin: 35,
    tempoMax: 50,
    freteGratisMin: 110,
    ativo: true
  },
  {
    id: 'lago-sul',
    nome: 'Lago Sul (SHIS e QI/QL)',
    regiao: 'Lago Sul',
    taxaEntrega: 11.90,
    tempoMin: 35,
    tempoMax: 55,
    freteGratisMin: 120,
    ativo: true
  },
  {
    id: 'cruzeiro',
    nome: 'Cruzeiro Velho e Novo',
    regiao: 'Cruzeiro',
    taxaEntrega: 7.90,
    tempoMin: 30,
    tempoMax: 45,
    freteGratisMin: 90,
    ativo: true
  },
  {
    id: 'guara-1-2',
    nome: 'Guará I e Guará II',
    regiao: 'Guará',
    taxaEntrega: 9.90,
    tempoMin: 35,
    tempoMax: 50,
    freteGratisMin: 100,
    ativo: true
  },
  {
    id: 'aguas-claras',
    nome: 'Águas Claras (Norte e Sul)',
    regiao: 'Águas Claras',
    taxaEntrega: 10.90,
    tempoMin: 40,
    tempoMax: 55,
    freteGratisMin: 110,
    ativo: true
  },
  {
    id: 'taguatinga',
    nome: 'Taguatinga (Norte, Sul e Centro)',
    regiao: 'Taguatinga',
    taxaEntrega: 12.90,
    tempoMin: 45,
    tempoMax: 60,
    freteGratisMin: 130,
    ativo: true
  },
  {
    id: 'vicente-pires',
    nome: 'Vicente Pires',
    regiao: 'Vicente Pires',
    taxaEntrega: 11.90,
    tempoMin: 40,
    tempoMax: 55,
    freteGratisMin: 120,
    ativo: true
  },
  {
    id: 'park-sul',
    nome: 'Park Sul & Setor de Garagens',
    regiao: 'Guará/Sudoeste',
    taxaEntrega: 8.90,
    tempoMin: 30,
    tempoMax: 45,
    freteGratisMin: 95,
    ativo: true
  },
  {
    id: 'vila-planalto',
    nome: 'Vila Planalto & Setor Hoteleiro',
    regiao: 'Plano Piloto',
    taxaEntrega: 7.90,
    tempoMin: 25,
    tempoMax: 40,
    freteGratisMin: 90,
    ativo: true
  }
];
