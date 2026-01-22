#!/bin/sh
# Script de diagnóstico para ejecutar dentro del contenedor
# Uso en Dokploy: Settings -> Monitoring -> Console -> ejecutar este script

echo "=== Verificando archivos en nginx ==="
ls -la /usr/share/nginx/html/

echo ""
echo "=== Contenido de index.html ==="
head -n 30 /usr/share/nginx/html/index.html

echo ""
echo "=== Archivos en /assets/ ==="
ls -la /usr/share/nginx/html/assets/ 2>&1 || echo "Carpeta assets no existe"

echo ""
echo "=== Configuración de nginx ==="
cat /etc/nginx/conf.d/default.conf

echo ""
echo "=== Test de nginx config ==="
nginx -t

echo ""
echo "=== Permisos ==="
ls -la /usr/share/nginx/html/ | head -n 5
