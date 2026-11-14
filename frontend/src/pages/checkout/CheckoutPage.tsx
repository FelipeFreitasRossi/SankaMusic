import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, CircleCheck, Clock, CreditCard, Lock, LogIn, MapPinPlus, ShoppingCart, Truck, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { addressService, orderService } from '../../services/accountService';
import { catalogService } from '../../services/catalogService';
import { ApiError, errorMessage } from '../../services/api';
import { useDocumentTitle } from '../../hooks';
import type { Address, AddressInput, Order, ShippingOption } from '../../types';
import { brl, maskCep } from '../../utils/format';
import { imgUrl } from '../../utils/constants';
import { AddressCard, AddressText } from '../../components/address/AddressCard';
import { AddressForm } from '../../components/address/AddressForm';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Field';
import { Alert, Badge, EmptyState, Spinner } from '../../components/ui/Feedback';
import { LogoMark } from '../../components/brand/Logo';
import s from './Checkout.module.css';

const STEPS = ['Identificação', 'Endereço', 'Frete', 'Revisão', 'Pagamento', 'Confirmação'] as const;

export default function CheckoutPage() {
  useDocumentTitle('Checkout');
  const { user, initializing } = useAuth();
  const { lines, totals, items, syncing, clear, refresh } = useCart();
  const { config } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[] | null>(null);
  const [shippingCode, setShippingCode] = useState<string | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentIssue, setPaymentIssue] = useState<string | null>(null);

  const address = useMemo(() => addresses?.find((a) => a.id === addressId) || null, [addresses, addressId]);
  const shipping = shippingOptions?.find((o) => o.code === shippingCode) || null;

  // Usuário já logado começa no endereço
  useEffect(() => {
    if (user && step === 0) setStep(1);
  }, [user, step]);

  // Carrega endereços
  useEffect(() => {
    if (!user) return;
    addressService
      .list()
      .then((list) => {
        setAddresses(list);
        const def = list.find((a) => a.is_default) || list[0];
        if (def) setAddressId((cur) => cur || def.id);
        if (!list.length) setAddingAddress(true);
      })
      .catch((e) => toast.error(errorMessage(e)));
  }, [user, toast]);

  // Cotação de frete quando chega na etapa
  useEffect(() => {
    if (step !== 2 || !address || !items.length) return;
    setShippingOptions(null);
    setShippingError(null);
    catalogService
      .shippingQuote(address.cep, items)
      .then((r) => {
        setShippingOptions(r.options);
        setShippingCode((cur) => (cur && r.options.some((o) => o.code === cur) ? cur : r.options[0]?.code || null));
      })
      .catch((e) => setShippingError(errorMessage(e)));
  }, [step, address, items]);

  if (initializing) return <Spinner />;

  if (!lines.length && !order && !syncing) {
    return (
      <div className="container page">
        <EmptyState icon={<ShoppingCart size={36} />} title="Seu carrinho está vazio" text="Adicione produtos para finalizar a compra." action={{ label: 'Ver produtos', to: '/produtos' }} />
      </div>
    );
  }

  const saveAddress = async (a: AddressInput) => {
    setSavingAddress(true);
    try {
      const created = await addressService.create(a);
      setAddresses((list) => [created, ...(list || []).map((x) => (created.is_default ? { ...x, is_default: false } : x))]);
      setAddressId(created.id);
      setAddingAddress(false);
      toast.success('Endereço salvo.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSavingAddress(false);
    }
  };

  const placeOrder = async () => {
    if (!address || !shipping) return;
    setPlacing(true);
    setPlaceError(null);
    let created: Order;
    try {
      created = await orderService.create({
        items,
        address_id: address.id,
        shipping_code: shipping.code,
        payment_method: 'mercadopago',
        notes: notes.trim() || undefined,
      });
    } catch (e) {
      setPlaceError(errorMessage(e));
      if (e instanceof ApiError && ['insufficient_stock', 'out_of_stock', 'product_unavailable'].includes(e.code || '')) refresh();
      setPlacing(false);
      return;
    }
    // Pedido criado: o estoque já foi reservado e o carrinho do servidor foi limpo
    setOrder(created);
    clear();
    try {
      const pay = await orderService.startPayment(created.id);
      window.location.href = pay.redirect_url; // ambiente seguro do provedor
    } catch (e) {
      setPaymentIssue(errorMessage(e));
      setStep(5);
      setPlacing(false);
    }
  };

  const canNext = [!!user, !!address && !addingAddress, !!shipping, true, false, false][step];
  const itemsTotal = totals.items_total;
  const grand = itemsTotal + (shipping?.price || 0);

  return (
    <div className={s.page}>
      <div className={s.topbar}>
        <div className={`container ${s.topbarInner}`}>
          <Link to="/carrinho" className={s.backLink}>
            <ArrowLeft size={18} /> <span>Voltar ao carrinho</span>
          </Link>
          <span className={s.brand}>
            <LogoMark size={28} /> Checkout seguro
          </span>
          <span className={s.secure}>
            <Lock size={16} /> <span>Ambiente protegido</span>
          </span>
        </div>
      </div>

      <div className="container">
        <ol className={s.stepper} aria-label="Etapas da compra">
          {STEPS.map((label, i) => (
            <li key={label} className={`${i < step ? s.stepDone : ''} ${i === step ? s.stepCurrent : ''}`} aria-current={i === step ? 'step' : undefined}>
              <span className={s.stepDot}>{i < step ? <Check size={14} /> : i + 1}</span>
              <span className={s.stepLabel}>{label}</span>
            </li>
          ))}
        </ol>
        <p className={s.stepMobile}>
          Etapa {step + 1} de {STEPS.length}: <b>{STEPS[step]}</b>
        </p>

        <div className={s.layout}>
          <section className={`card ${s.main}`} style={step === 5 ? { gridColumn: '1 / -1', maxWidth: 760, width: '100%', margin: '0 auto' } : undefined}>
            {/* 1. IDENTIFICAÇÃO */}
            {step === 0 && (
              <div className={s.panel}>
                <h2>Identificação</h2>
                <p className="muted">Para sua segurança e para acompanhar o pedido, entre ou crie uma conta.</p>
                <div className={s.authChoices}>
                  <Link to="/entrar?next=/checkout" className={s.authChoice}>
                    <LogIn size={26} />
                    <b>Já sou cliente</b>
                    <small>Entrar com e-mail e senha</small>
                  </Link>
                  <Link to="/cadastro?next=/checkout" className={s.authChoice}>
                    <UserPlus size={26} />
                    <b>Primeira compra</b>
                    <small>Criar conta em menos de 1 minuto</small>
                  </Link>
                </div>
                <p className={s.hint}>Seu carrinho fica salvo enquanto você se identifica.</p>
              </div>
            )}

            {/* 2. ENDEREÇO */}
            {step === 1 && (
              <div className={s.panel}>
                <div className={s.panelHead}>
                  <h2>Endereço de entrega</h2>
                  {!addingAddress && (
                    <Button size="sm" variant="outline" onClick={() => setAddingAddress(true)} icon={<MapPinPlus size={16} />}>
                      Novo endereço
                    </Button>
                  )}
                </div>
                {addresses === null ? (
                  <Spinner label="Carregando endereços..." />
                ) : addingAddress ? (
                  <AddressForm
                    initial={{ recipient: user?.name || '', label: 'Casa', cep: '', street: '', number: '', district: '', city: '', state: '', is_default: !addresses.length, phone: user?.phone || '' }}
                    submitLabel="Usar este endereço"
                    loading={savingAddress}
                    onSubmit={saveAddress}
                    onCancel={addresses.length ? () => setAddingAddress(false) : undefined}
                  />
                ) : (
                  <div className={s.addressGrid}>
                    {addresses.map((a) => (
                      <AddressCard key={a.id} address={a} selected={a.id === addressId} onSelect={() => setAddressId(a.id)} badge={a.is_default ? <Badge tone="orange">Principal</Badge> : undefined} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. FRETE */}
            {step === 2 && (
              <div className={s.panel}>
                <h2>Escolha do frete</h2>
                <p className="muted">
                  Entrega para CEP {address && maskCep(address.cep)} — {address?.city}/{address?.state}
                </p>
                {shippingError ? (
                  <Alert>{shippingError}</Alert>
                ) : !shippingOptions ? (
                  <Spinner label="Calculando frete..." />
                ) : (
                  <div className={s.options} role="radiogroup" aria-label="Opções de frete">
                    {shippingOptions.map((o) => (
                      <label key={o.code} className={`${s.option} ${shippingCode === o.code ? s.optionOn : ''}`}>
                        <input type="radio" name="shipping" checked={shippingCode === o.code} onChange={() => setShippingCode(o.code)} />
                        <Truck size={22} />
                        <span>
                          <b>{o.name}</b>
                          <small>{o.code === 'pickup' ? o.description : `Até ${o.days} dias úteis após a confirmação do pagamento`}</small>
                        </span>
                        <strong>{o.price === 0 ? 'Grátis' : brl(o.price)}</strong>
                      </label>
                    ))}
                  </div>
                )}
                <p className={s.hint}>Valores estimados; o frete final é recalculado pelo servidor ao criar o pedido.</p>
              </div>
            )}

            {/* 4. REVISÃO */}
            {step === 3 && address && shipping && (
              <div className={s.panel}>
                <h2>Revise seu pedido</h2>
                <div className={s.reviewGrid}>
                  <div className={s.reviewBlock}>
                    <div className={s.reviewHead}>
                      <b>Entrega</b>
                      <button onClick={() => setStep(1)}>Alterar</button>
                    </div>
                    <AddressText a={address} />
                  </div>
                  <div className={s.reviewBlock}>
                    <div className={s.reviewHead}>
                      <b>Frete</b>
                      <button onClick={() => setStep(2)}>Alterar</button>
                    </div>
                    <p>
                      {shipping.name} — {shipping.price ? brl(shipping.price) : 'Grátis'}
                    </p>
                  </div>
                </div>
                <ul className={s.reviewItems}>
                  {lines.map((l) => (
                    <li key={l.product_id}>
                      <img src={imgUrl(l.image)} alt="" />
                      <span>
                        {l.name}
                        <small>
                          {l.quantity} × {brl(l.unit_price)}
                        </small>
                      </span>
                      <strong>{brl(l.unit_price * l.quantity)}</strong>
                    </li>
                  ))}
                </ul>
                <Textarea label="Observações (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Ex.: ponto de referência, horário preferido…" />
              </div>
            )}

            {/* 5. PAGAMENTO */}
            {step === 4 && (
              <div className={s.panel}>
                <h2>Pagamento</h2>
                <label className={`${s.option} ${s.optionOn}`}>
                  <input type="radio" name="payment" checked readOnly />
                  <CreditCard size={22} />
                  <span>
                    <b>Mercado Pago</b>
                    <small>Cartão de crédito, Pix ou boleto no ambiente seguro do Mercado Pago.</small>
                  </span>
                </label>
                {!config.payments_enabled && (
                  <Alert tone="notice">
                    O pagamento online ainda não foi configurado nesta loja. Você poderá registrar o pedido, que ficará como <b>“Aguardando pagamento”</b> até a ativação do provedor.
                  </Alert>
                )}
                <p className={s.hint}>
                  Ao confirmar, o pedido é criado com os valores recalculados pelo servidor e você será direcionado ao provedor. A compra só é aprovada após a confirmação do pagamento.
                </p>
                {placeError && <Alert>{placeError}</Alert>}
                <Button size="lg" block loading={placing} onClick={placeOrder} icon={<Lock size={18} />}>
                  Confirmar pedido e pagar {brl(grand)}
                </Button>
              </div>
            )}

            {/* 6. CONFIRMAÇÃO */}
            {step === 5 && order && (
              <div className={`${s.panel} ${s.confirm}`}>
                <span className={s.confirmIcon}>
                  <Clock size={34} />
                </span>
                <h2>Pedido #{order.number} registrado</h2>
                <Badge tone="warning">Aguardando pagamento</Badge>
                <p className="muted">
                  Os itens foram reservados. Seu pedido será confirmado somente após a aprovação do pagamento pelo provedor.
                </p>
                {paymentIssue && <Alert tone="notice">{paymentIssue}</Alert>}
                <div className={s.confirmActions}>
                  <Button onClick={() => navigate(`/conta/pedidos/${order.id}`)} icon={<CircleCheck size={18} />}>
                    Ver meu pedido
                  </Button>
                  <Button variant="outline" to="/">
                    Voltar à loja
                  </Button>
                </div>
              </div>
            )}

            {step > 0 && step < 4 && (
              <div className={s.nav}>
                <Button variant="ghost" onClick={() => setStep(step - 1)} icon={<ArrowLeft size={16} />} disabled={step === 1}>
                  Voltar
                </Button>
                <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
                  Continuar <ArrowRight size={16} />
                </Button>
              </div>
            )}
            {step === 4 && (
              <div className={s.nav}>
                <Button variant="ghost" onClick={() => setStep(3)} icon={<ArrowLeft size={16} />} disabled={placing}>
                  Voltar
                </Button>
              </div>
            )}
          </section>

          {step < 5 && (
            <aside className={`card ${s.summary}`}>
              <h2>Resumo</h2>
              <ul className={s.sumItems}>
                {lines.map((l) => (
                  <li key={l.product_id}>
                    <span className={s.sumThumb}>
                      <img src={imgUrl(l.image)} alt="" />
                      <b>{l.quantity}</b>
                    </span>
                    <span className={s.sumName}>{l.name}</span>
                    <span>{brl(l.unit_price * l.quantity)}</span>
                  </li>
                ))}
              </ul>
              <dl className={s.sumTotals}>
                <div>
                  <dt>Subtotal</dt>
                  <dd>{brl(totals.subtotal)}</dd>
                </div>
                {totals.discount > 0 && (
                  <div className={s.discount}>
                    <dt>Descontos</dt>
                    <dd>- {brl(totals.discount)}</dd>
                  </div>
                )}
                <div>
                  <dt>Frete</dt>
                  <dd>{shipping ? (shipping.price ? brl(shipping.price) : 'Grátis') : '—'}</dd>
                </div>
                <div className={s.grand}>
                  <dt>Total</dt>
                  <dd>{syncing ? '…' : brl(grand)}</dd>
                </div>
              </dl>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
