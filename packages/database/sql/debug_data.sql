/* Important: Only insert on a clean database, otherwise IDs might conflict */

INSERT INTO players (id, name, playtime, first_seen, last_seen) VALUES
    (1, 'admin', 7200000, strftime('%s', datetime('now', '-30 days')), strftime('%s', datetime('now', '-1 hour'))),
    (2, 'StreetRacer99', 7200000, strftime('%s', datetime('now', '-30 days')), strftime('%s', datetime('now', '-1 hour'))),
    (3, 'NightOwlGamer', 27000000, strftime('%s', datetime('now', '-60 days')), strftime('%s', datetime('now', '-3 hours'))),
    (4, 'ShadowWalker', 5100000, strftime('%s', datetime('now', '-5 days')), strftime('%s', datetime('now', '-30 minutes'))),
    (5, 'IronFistMike', 55200000, strftime('%s', datetime('now', '-120 days')), strftime('%s', datetime('now', '-2 days'))),
    (6, 'QuickSilverX', 18600000, strftime('%s', datetime('now', '-45 days')), strftime('%s', datetime('now', '-5 hours'))),
    (7, 'DarkMatterZ', 900000, strftime('%s', datetime('now', '-1 days')), strftime('%s', datetime('now', '-10 minutes'))),
    (8, 'BlazingFury', 40200000, strftime('%s', datetime('now', '-90 days')), strftime('%s', datetime('now', '-1 day'))),
    (9, 'GhostProtocol', 13800000, strftime('%s', datetime('now', '-20 days')), strftime('%s', datetime('now', '-4 hours'))),
    (10, 'ThunderStrike', 72000000, strftime('%s', datetime('now', '-200 days')), strftime('%s', datetime('now', '-6 hours'))),
    (11, 'NeonViper', 3300000, strftime('%s', datetime('now', '-3 days')), strftime('%s', datetime('now', '-45 minutes')));

INSERT INTO player_identifiers (player_id, type, value) VALUES
    (1, 'license', 'license:mockd4e5f6a1c3d4e5f6b2c3d4b2c3d4e5f6a1b2'),
    (2, 'license', 'license:mockc3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'),
    (3, 'license', 'license:mockd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3'),
    (4, 'license', 'license:mocke5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4'),
    (5, 'license', 'license:mockf6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5'),
    (6, 'license', 'license:mocka1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6'),
    (7, 'license', 'license:mockb2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1'),
    (8, 'license', 'license:mockc3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6b2c3'),
    (9, 'license', 'license:mockd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6b2c3d4'),
    (10, 'license', 'license:mocke5f6a1b2c3d4e5f6a1b2c3d4e5f6c3d4e5f6'),
    (11, 'license', 'license:mockf6a1b2c3d4e5f6a1b2c3d4e5f6d4e5f6a1b2');

INSERT INTO admin_users (id, username, password_hash, player_id, permissions, created_at, last_login_at) VALUES
    /* password is "password" */
    (1, "admin", "$2b$10$oirDDGH10Qiun.MpWRkYNu7QmKfXnGqm5ECS0ohfNrhUfde4fngsG", 1, 1073741824, 1773054660, null);

INSERT INTO bans (id, player_id, reason, issuer, expires_at, created_at, revoked_at) VALUES
    (1, 7, 'This is an example Perma-Ban', 1, NULL, 1777113143, NULL),
    (2, 10, 'Why ban ? Because I need mock data and he already got 3 mock warnings.', 1, 1777113941, 1777113913, NULL),
    (3, 10, 'I like bans and bans like this mock account. Slam him with a 2 week !', 1, 1778323541, 1777113941, NULL),
    (4, 1, 'This is going to be an accidental ban :D', 1, NULL, 1777113985, 1777114033),
    (6, 6, 'He shall be selected, why because randomness and also he''s clean without any punishments. Maybe also because I didn''t want mock data to have similar sections.', 1, 1777362503, 1777114103, NULL);

INSERT INTO kicks (id, player_id, reason, revoked, issuer, issued_at) VALUES
    (1, 5, 'An example kick', 0, 1, 1777113194),
    (2, 11, 'Attempted to evade mock data', 1, 1, 1777113223);

INSERT INTO warns (id, player_id, reason, "read", revoked, issuer, issued_at) VALUES
    (1, 7, 'Warning him because I need test data.', 0, 0, 1, 1777113127),
    (2, 10, 'This is one example warn', 0, 0, 1, 1777113843),
    (3, 10, 'And another warn, because why not', 0, 0, 1, 1777113855),
    (4, 10, 'And a third warning, because 3 is a nice number. What''s next ? Well a ban of course', 0, 0, 1, 1777113874);

INSERT INTO player_notes (id, player_id, content, issuer, issued_at) VALUES
    (1, 4, "Seems like a nice chap.", 1, 1777113158);
