#!/bin/sh

set -e

cd /var/www

if [ ! -d "vendor" ]; then
    echo "Vendor directory not found. Running composer install..."
    composer install --no-interaction --prefer-dist
fi

exec "$@"