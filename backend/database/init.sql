\c postgres;

DROP DATABASE IF EXISTS tienda_frescos;

CREATE DATABASE tienda_frescos;

\c tienda_frescos;

\i backend/database/schema.sql
