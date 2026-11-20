# 🚴 PedalTrack

Velocímetro de bicicleta com GPS, feito para funcionar diretamente no celular. Sem cadastro, sem anúncios e sem envio dos trajetos para um servidor.

## O que faz
- Velocidade atual, média e máxima
- Distância percorrida e tempo em movimento
- Calorias aproximadas (a partir do peso informado e da intensidade estimada)
- Traçado esquemático do percurso e exportação GPX
- Histórico das últimas 12 pedaladas no navegador
- Instalação na tela inicial (PWA) e interface disponível offline após o primeiro acesso

## Publicar pelo GitHub Pages

1. Abra **Settings → Pages** neste repositório.
2. Em **Build and deployment → Source**, selecione **Deploy from a branch**.
3. Escolha a branch **main** e a pasta **/(root)**, depois **Save**.
4. Após a publicação, use o endereço exibido em **Settings → Pages** (normalmente `https://guilhermebarros2711.github.io/GPS/`).
5. No Chrome do Android, permita acesso à localização e use **Adicionar à tela inicial**.

Também funciona na Vercel: importe o repositório e use as configurações padrão para um site estático, sem build.

## Como pedalar

Abra o site em HTTPS, informe o peso (opcional), toque em **Iniciar pedalada** e autorize o GPS. Ao terminar, toque em **Finalizar**. Se quiser levar o trajeto para outro app, exporte o arquivo GPX **antes de iniciar uma nova pedalada**.

## Limitações e privacidade

- A localização por GPS requer **HTTPS** e permissão explícita. Abrir `index.html` diretamente como um arquivo pode não funcionar.
- Navegadores podem **suspender o GPS quando a tela apaga ou o app fica em segundo plano**. Mantenha o app aberto para resultados confiáveis; para pedaladas longas com tela apagada, prefira um aplicativo nativo.
- Velocidade, distância e calorias são estimativas. A precisão depende do sinal GPS e as calorias são calculadas por MET, não por sensores de frequência cardíaca.
- O histórico e o peso ficam no `localStorage` **deste navegador/dispositivo**. Não há conta nem backend. Limpar os dados do navegador apaga o histórico.
- Arquivos GPX contêm localizações sensíveis: compartilhe com cuidado.
- Segurança primeiro: evite olhar ou tocar no celular enquanto estiver pedalando.

## Desenvolvimento

Site estático em HTML, CSS e JavaScript; sem dependências. Para testar no computador, execute `python -m http.server 8000` nesta pasta e acesse `http://localhost:8000`. O GPS do navegador funciona em `localhost` ou hospedagem HTTPS.

## Estrutura

- `index.html` — interface e lógica de GPS
- `manifest.webmanifest` — configuração do aplicativo instalável
- `sw.js` — cache para uso offline da interface
- `icon.svg`, `icon-192.png`, `icon-512.png` — ícones

**PedalTrack — projeto de pedaladas.**
