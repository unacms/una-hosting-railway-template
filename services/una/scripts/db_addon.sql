-- Based on ansible/templates/cnf/db_addon.sql, mounted at /tmp/addon.sql.
-- The boot script fills the {{ }} tokens, then the image installer appends
-- this file to install/sql/addon.sql and executes it.

-- make UNA to log to stderr 
UPDATE `sys_options` SET `value` = 'STDErr' WHERE `name` = 'sys_logs_storage_default';

-- enable API for NEO
UPDATE `sys_options` SET `value` = 'on' WHERE `name` = 'sys_api_enable';
UPDATE `sys_options` SET `value` = '' WHERE `name` = 'sys_api_access_by_origin';
UPDATE `sys_options` SET `value` = 'on' WHERE `name` = 'sys_api_access_by_key';
UPDATE `sys_options` SET `value` = '' WHERE `name` = 'sys_api_access_unsafe_services';
UPDATE `sys_options` SET `VALUE` = 'splash' WHERE `Name` = 'sys_api_root_page_guest';

UPDATE `sys_options` SET `value` = 'sys_sockets_soketi' WHERE `name` = 'sys_sockets_type';
UPDATE `sys_options` SET `value` = '{{ proto }}://{{ host }}' WHERE `name` = 'sys_sockets_url';
UPDATE `sys_options` SET `value` = 'main' WHERE `name` = 'sys_sockets_app_id';
UPDATE `sys_options` SET `value` = 'main' WHERE `name` = 'sys_sockets_key';
UPDATE `sys_options` SET `value` = '{{ soketi_secret }}' WHERE `name` = 'sys_sockets_secret';

-- Messenger talks to jot. URL and JWT come from UNA_JOT_SERVER_URL / UNA_JOT_JWT_SECRET.
UPDATE `sys_options` SET `value` = '{{ jot_server_url }}' WHERE `name` = 'bx_messenger_server_url';
UPDATE `sys_options` SET `value` = '{{ jot_jwt_secret }}' WHERE `name` = 'bx_messenger_jot_server_jwt';

DELETE FROM `sys_api_keys` WHERE `key` = '{{ neoUnaApiKey }}';
INSERT IGNORE INTO `sys_api_keys` (`title`, `key`, `order`) VALUES ('NEO', '{{ neoUnaApiKey }}', 1);
