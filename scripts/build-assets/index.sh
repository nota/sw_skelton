#!/bin/sh
cp -R src/client/img public/assets/

mkdir -p public/assets/fonts/
cp -R node_modules/bootstrap-sass/assets/fonts/bootstrap/* public/assets/fonts/
cp -R node_modules/font-awesome/fonts/* public/assets/fonts/

echo "scripts/build-assets done."
