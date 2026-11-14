"""Envio de e-mails.

Se SMTP_HOST estiver configurado, envia via SMTP (ex.: o e-mail do próprio
cPanel/HostGator, Brevo, Amazon SES, Mailgun). Caso contrário, apenas registra
a mensagem no log — útil em desenvolvimento.
"""
import html as html_lib
import logging
import smtplib
import ssl
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("sanka.email")


def send_email(to: str, subject: str, text: str, html: str | None = None) -> bool:
    if not settings.email_enabled:
        logger.info("[E-MAIL NÃO ENVIADO — SMTP não configurado] Para: %s | Assunto: %s\n%s", to, subject, text)
        return False

    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text)
    if html:
        msg.add_alternative(html, subtype="html")

    try:
        if settings.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, context=ssl.create_default_context(), timeout=15) as s:
                if settings.SMTP_USER:
                    s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                s.send_message(msg)
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as s:
                if settings.SMTP_TLS:
                    s.starttls(context=ssl.create_default_context())
                if settings.SMTP_USER:
                    s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                s.send_message(msg)
        logger.info("E-mail enviado para %s (%s)", to, subject)
        return True
    except Exception:  # noqa: BLE001 — falha de e-mail não deve derrubar a requisição
        logger.exception("Falha ao enviar e-mail para %s", to)
        return False


def send_password_reset(to: str, name: str, link: str) -> None:
    minutes = settings.PASSWORD_RESET_EXPIRE_MINUTES
    text = (
        f"Olá, {name}!\n\nRecebemos uma solicitação para redefinir sua senha na Sanka Music.\n"
        f"Acesse o link abaixo (válido por {minutes} minutos):\n\n{link}\n\n"
        "Se você não fez esta solicitação, ignore este e-mail."
    )
    safe_name = html_lib.escape(name)
    safe_link = html_lib.escape(link, quote=True)
    html = (
        f"<p>Olá, {safe_name}!</p><p>Recebemos uma solicitação para redefinir sua senha na <b>Sanka Music</b>.</p>"
        f'<p><a href="{safe_link}" style="background:#FF6A00;color:#fff;padding:12px 20px;border-radius:8px;'
        f'text-decoration:none">Redefinir senha</a></p><p>O link é válido por {minutes} minutos.</p>'
        "<p>Se você não fez esta solicitação, ignore este e-mail.</p>"
    )
    send_email(to, "Redefinição de senha — Sanka Music", text, html)


def send_order_created(to: str, name: str, number: int, total: float) -> None:
    valor = f"{total:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    text = (
        f"Olá, {name}!\n\nRecebemos seu pedido #{number} no valor de R$ {valor}.\n"
        "Ele ficará como 'Aguardando pagamento' até a confirmação do provedor de pagamento.\n\n"
        f"Acompanhe em: {settings.FRONTEND_URL}/conta/pedidos"
    )
    send_email(to, f"Pedido #{number} recebido — Sanka Music", text)
