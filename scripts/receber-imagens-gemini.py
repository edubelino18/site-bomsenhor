"""Recebe as imagens geradas no Google AI Studio e salva no computador.

Uso:
    python scripts/receber-imagens-gemini.py [pasta de saída]     (padrão: _gemini/out)

Fica rodando e escuta só em 127.0.0.1:8799 (apenas este computador). A aba do
AI Studio envia a imagem gerada com um fetch (POST /<nome>.png). Na primeira
vez o Chrome pede permissão para o AI Studio "acessar outros apps e serviços
neste dispositivo": quem decide e clica em Permitir é o usuário.

Por que existe: os downloads do Chrome ficaram presos como .tmp e se perderam
quando as abas foram fechadas. Com o receptor, a imagem chega inteira e com nome.
"""

import os
import re
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(RAIZ, '_gemini', 'out')
os.makedirs(OUT, exist_ok=True)


class Receptor(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', 'https://aistudio.google.com')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Private-Network', 'true')

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        nome = os.path.basename(self.path)
        if not re.fullmatch(r'[a-z0-9-]+\.png', nome):
            self.send_response(400)
            self._cors()
            self.end_headers()
            return
        dados = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        with open(os.path.join(OUT, nome), 'wb') as f:
            f.write(dados)
        print('salvo', nome, len(dados), 'bytes', flush=True)
        self.send_response(200)
        self._cors()
        self.end_headers()
        self.wfile.write(b'ok')

    def log_message(self, *args):
        pass


print('Recebendo imagens em', OUT, '(Ctrl+C para parar)', flush=True)
HTTPServer(('127.0.0.1', 8799), Receptor).serve_forever()
