# Portal Sono Show

O login do portal consulta o ERP Firebird por meio do SonoShowGateway.

## Variáveis da Vercel

Configure como variáveis secretas nos ambientes usados pelo projeto:

```text
FIREBIRD_GATEWAY_URL=https://gateway.jgmelo.company
FIREBIRD_GATEWAY_TOKEN_ID=ssg_...
FIREBIRD_GATEWAY_HMAC_SECRET=...
```

Nunca use o prefixo `NEXT_PUBLIC_` nessas variáveis. As credenciais e o endereço
direto do Firebird permanecem somente no Windows TS.

Crie um token exclusivo no TS com:

```powershell
.\SonoShowGateway.exe token-create portal-sono-show
```
