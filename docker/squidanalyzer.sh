#!/bin/bash

docker exec squidanalyzer ln -sf /var/www/html/squidreport/flotr2.js /var/www/html/flotr2.js
docker exec squidanalyzer ln -sf /var/www/html/squidreport/sorttable.js /var/www/html/sorttable.js
docker exec squidanalyzer ln -sf /var/www/html/squidreport/images /var/www/html/images
docker exec squidanalyzer sed -i 's|root         /var/www/html/squidreport;|root         /var/www/html;|g' /etc/nginx/nginx.conf
docker exec squidanalyzer nginx -s reload