# Stage 1: Build dependencies with Composer
# This stage creates a clean vendor directory without any application code.
FROM composer:2 as vendor

WORKDIR /app

COPY composer.json composer.json
COPY composer.lock composer.lock

# Install all dependencies. We are not using --no-dev or --no-scripts 
# to ensure all necessary classes and autoload files are generated.
RUN composer install --no-interaction --prefer-dist --optimize-autoloader


# Stage 2: Build the final, lean application image
FROM php:8.2-fpm-alpine

WORKDIR /var/www

# Install build-time dependencies, install the redis extension, then remove the build-deps
RUN apk add --no-cache --virtual .build-deps \
        $PHPIZE_DEPS \
        autoconf \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

# Install persistent system dependencies and other required PHP extensions
RUN apk add --no-cache \
        libzip-dev \
        zip \
    && docker-php-ext-install pdo_mysql zip

# Copy the application code from your local machine into the image
COPY . .

# Copy the clean vendor directory from our first 'vendor' stage.
# This overlays the correct dependencies on top of the application code.
COPY --from=vendor /app/vendor/ /var/www/vendor/

# Set correct permissions for Lumen to be able to write to storage and cache
RUN mkdir -p storage/framework/{views,cache,sessions} \
    && mkdir -p bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 9000
CMD ["php-fpm"]