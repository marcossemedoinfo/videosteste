# FutStream — Guia de Jogos & Player IPTV (Estudos)

Aplicação web estática (HTML, CSS e JavaScript puro com `hls.js`) que combina:
- **Jogos do Dia & Placares ao Vivo** via endpoints públicos da ESPN (Brasileirão, Libertadores, Sul-Americana, Champions League, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, NBA, etc.).
- **Player ao Vivo (`.m3u` / `.m3u8`)** com `hls.js`, seletor de qualidade e suporte a listas abertas do projeto [`iptv-org/iptv`](https://github.com/iptv-org/iptv).
- **Gerenciador de Listas Locais** salvo no `localStorage` do navegador + função serverless `netlify/functions/m3u-proxy.mjs` para carregar playlists `.m3u` sem CORS quando hospedado no Netlify.

## Rodar localmente

1. Dê um duplo clique em `ABRIR_SITE.bat`, ou rode no terminal:
   ```bash
   python -m http.server 8080 --directory public
   ```
2. Acesse `http://localhost:8080`.

## Subir no GitHub e publicar no Netlify

1. Envie atualizações para o GitHub:
   ```bash
   git push -u origin main
   ```
2. No **Netlify**: clique em **Add new site → Import an existing project → GitHub** e selecione o repositório `videosteste`. O arquivo `netlify.toml` já configura a publicação (`public/`) e a function de proxy automaticamente.
