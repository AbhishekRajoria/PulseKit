INSERT INTO users( id, email, password_hash, name )
VALUES ( 'd67d29bd-0000-0000-0000-000000000001', 'pulsekit@dev.com', '$2b$10$Qe3g9pORdeJevJ5MkF9b1eULn2j2CzNM0cHYBGwOGI/rBQelnA6ym', 'pk_admin' );

INSERT INTO projects ( id, user_id, name, api_key, rate_limit_per_min)
VALUES( '95f07057-0000-0000-0000-000000000001', 'd67d29bd-0000-0000-0000-000000000001', 'My Project', 'dev_apikey_123', 30 );
