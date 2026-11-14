"""Nomes das coleções do MongoDB e enums de domínio.

Modelagem (relacionamentos por identificador — ObjectId em string ou nativo):

users            {_id, name, email, password_hash, phone, cpf, role, active, created_at, updated_at}
categories       {_id, name, slug, description, icon, image, order, active}
products         {_id, name, slug, sku, brand, category_id, category_slug, price, promo_price,
                  final_price, stock, description, specs[{label, value}], images[url],
                  rating_avg, rating_count, sold_count, featured, active, is_demo,
                  created_at, updated_at}
carts            {_id, user_id, items[{product_id, quantity}], updated_at}
favorites        {_id, user_id, product_id, created_at}
addresses        {_id, user_id, label, recipient, cep, street, number, complement,
                  district, city, state, phone, is_default, created_at}
orders           {_id, number, user_id, customer{name,email,phone,cpf}, items[{product_id, name,
                  slug, image, sku, unit_price, list_price, quantity, line_total}],
                  shipping_address{...}, shipping{code, name, price, days},
                  subtotal, discount, shipping_price, total, status, status_history[],
                  payment{method, status, payment_id}, created_at, updated_at}
payments         {_id, order_id, user_id, provider, provider_payment_id, preference_id,
                  status, amount, raw_status, created_at, updated_at}
reviews          {_id, product_id, user_id, user_name, rating, title, comment, created_at}
password_resets  {_id, user_id, token_hash, expires_at, used}
newsletter       {_id, email, created_at}
counters         {_id: "orders", seq}
"""
from enum import Enum


class Collections:
    USERS = "users"
    PRODUCTS = "products"
    CATEGORIES = "categories"
    ORDERS = "orders"
    CARTS = "carts"
    FAVORITES = "favorites"
    ADDRESSES = "addresses"
    PAYMENTS = "payments"
    REVIEWS = "reviews"
    PASSWORD_RESETS = "password_resets"
    NEWSLETTER = "newsletter"
    COUNTERS = "counters"


class Role(str, Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"


class OrderStatus(str, Enum):
    AWAITING_PAYMENT = "awaiting_payment"
    PAYMENT_APPROVED = "payment_approved"
    PREPARING = "preparing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELED = "canceled"


ORDER_STATUS_LABELS = {
    OrderStatus.AWAITING_PAYMENT: "Aguardando pagamento",
    OrderStatus.PAYMENT_APPROVED: "Pagamento aprovado",
    OrderStatus.PREPARING: "Em preparação",
    OrderStatus.SHIPPED: "Enviado",
    OrderStatus.DELIVERED: "Entregue",
    OrderStatus.CANCELED: "Cancelado",
}

# Transições permitidas pelo painel administrativo.
# "payment_approved" só é definido manualmente quando o admin confirma um
# pagamento recebido fora do gateway (ex.: transferência conferida).
ALLOWED_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.AWAITING_PAYMENT: {OrderStatus.PAYMENT_APPROVED, OrderStatus.CANCELED},
    OrderStatus.PAYMENT_APPROVED: {OrderStatus.PREPARING, OrderStatus.CANCELED},
    OrderStatus.PREPARING: {OrderStatus.SHIPPED, OrderStatus.CANCELED},
    OrderStatus.SHIPPED: {OrderStatus.DELIVERED},
    OrderStatus.DELIVERED: set(),
    OrderStatus.CANCELED: set(),
}


class PaymentStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    IN_PROCESS = "in_process"
    REJECTED = "rejected"
    CANCELED = "canceled"
    REFUNDED = "refunded"
