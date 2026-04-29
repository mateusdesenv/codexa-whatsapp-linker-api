const DEFAULT_LEAD_CATEGORIES = [
  { name: 'Sem site', description: 'Empresas sem presença online própria.', message: 'Olá {{nome}}, tudo bem? Vi que vocês ainda não possuem um site profissional e posso te mostrar uma ideia rápida.' },
  { name: 'Com Site ruim', description: 'Empresas com site antigo ou pouco profissional.', message: 'Olá {{nome}}, tudo bem? Vi o site de vocês e tenho algumas ideias para deixar ele mais moderno e profissional.' },
  { name: 'Com Site bom', description: 'Empresas com site bom, mas com oportunidade de melhoria.', message: 'Olá {{nome}}, tudo bem? Vi que vocês já possuem um site, o que é ótimo. Posso te mostrar uma ideia para melhorar ainda mais a presença digital de vocês?' },
  { name: 'Com site fora do ar', description: 'Site indisponível ou com erro.', message: 'Olá {{nome}}, tudo bem? Tentei acessar o site de vocês e percebi que ele parece estar fora do ar. Posso te mostrar uma solução rápida?' }
];

const DEFAULT_LEAD_STATUSES = [
  { name: 'Novo', description: 'Lead ainda não iniciado.', position: 1 },
  { name: 'Em prospecção', description: 'Lead em processo de prospecção.', position: 2 },
  { name: 'Contato feito', description: 'Mensagem enviada pelo WhatsApp.', position: 3 },
  { name: 'Interessado', description: 'Lead demonstrou interesse.', position: 4 },
  { name: 'Reunião marcada', description: 'Reunião agendada com o lead.', position: 5 },
  { name: 'Fechado', description: 'Lead convertido em cliente.', position: 6 },
  { name: 'Perdido', description: 'Lead não avançou.', position: 7 }
];

const DEFAULT_SETTINGS = {
  theme: 'dark',
  menuOrder: ['generator', 'leads', 'settings'],
  menuVisibility: {
    generator: true,
    messages: true,
    leads: true,
    categories: true,
    statuses: true,
    settings: true
  },
  settingsSectionOrder: ['theme', 'menu', 'status', 'backup']
};

module.exports = { DEFAULT_LEAD_CATEGORIES, DEFAULT_LEAD_STATUSES, DEFAULT_SETTINGS };
