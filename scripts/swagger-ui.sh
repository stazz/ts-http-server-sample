 #!/bin/sh
 
 docker run \
   -p 80:8080 \
   -e 'SWAGGER_JSON_URL=http://localhost:3000/api-md' \
   swaggerapi/swagger-ui