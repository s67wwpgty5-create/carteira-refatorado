#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  CONTROLE DE CARTEIRA - TESTE LOCAL                        ║"
echo "║                                                            ║"
echo "║  Instalando dependências...                               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Instalar deps
npm install

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Compilando TypeScript...                                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Compilar
npm run build

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Iniciando servidor de desenvolvimento...                  ║"
echo "║                                                            ║"
echo "║  🌐 Acesse: http://localhost:5173/                         ║"
echo "║                                                            ║"
echo "║  Pressione Ctrl+C para parar                              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Rodar dev
npm run dev
