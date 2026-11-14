/**
 * Informações institucionais da loja.
 *
 * ⚠️ PREENCHA com os dados REAIS da Sanka Music antes de publicar.
 * Campos vazios não são exibidos no site — nada aqui é inventado.
 */
export const STORE_INFO = {
  name: 'Sanka Music',
  legalName: '', // Razão social
  cnpj: '',
  address: '', // Endereço completo da loja física (se houver)
  phone: '',
  whatsapp: '', // apenas dígitos com DDI, ex.: 5511999999999
  email: '',
  openingHours: '',
  social: {
    instagram: '', // URL completa
    facebook: '',
    youtube: '',
  },
};

/** Conteúdo das páginas institucionais — substitua pelos textos oficiais da loja. */
export const INFO_PAGES: Record<string, { title: string; body: string[] }> = {
  sobre: {
    title: 'Sobre a Sanka Music',
    body: [
      'A Sanka Music é uma loja especializada em instrumentos musicais e equipamentos de áudio.',
      'Este texto é provisório: substitua-o pela história, missão e diferenciais reais da loja em src/utils/store.ts.',
    ],
  },
  'trocas-e-devolucoes': {
    title: 'Trocas e devoluções',
    body: [
      'Conforme o Código de Defesa do Consumidor (art. 49), compras realizadas fora do estabelecimento comercial podem ser canceladas em até 7 dias corridos após o recebimento.',
      'A política completa de trocas da loja (prazos adicionais, condições e procedimento) deve ser definida pela Sanka Music e publicada aqui.',
    ],
  },
  'politica-de-privacidade': {
    title: 'Política de privacidade',
    body: [
      'Coletamos apenas os dados necessários para processar pedidos, entregas e o atendimento, em conformidade com a LGPD (Lei 13.709/2018).',
      'Senhas são armazenadas com criptografia (hash) e dados de pagamento são processados diretamente pelo provedor de pagamento — a loja não armazena dados de cartão.',
      'Texto provisório: a política definitiva deve ser revisada pelo responsável jurídico da loja.',
    ],
  },
  termos: {
    title: 'Termos de uso',
    body: ['Texto provisório. Os termos de uso oficiais da Sanka Music devem ser publicados aqui antes da abertura da loja.'],
  },
  'como-comprar': {
    title: 'Como comprar',
    body: [
      '1. Encontre o produto pela busca ou pelas categorias e clique em "Adicionar ao carrinho".',
      '2. No carrinho, confira os itens e clique em "Finalizar compra".',
      '3. Identifique-se (entre ou crie sua conta), informe o endereço de entrega e escolha o frete.',
      '4. Revise o pedido e siga para o pagamento no ambiente seguro do provedor.',
      '5. O pedido é confirmado somente após a aprovação do pagamento pelo provedor. Acompanhe tudo em "Minha conta > Pedidos".',
    ],
  },
};
